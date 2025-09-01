import { ProjectContext, BMCData, AIAnalysis } from '@/types/bmc';
import { LLMProvider_Interface, LLMConfig, LLMResponse } from '../types';
import { buildAnalysisPrompt, SYSTEM_PROMPTS } from '../prompts';

interface OllamaResponse {
  response: string;
  model: string;
  created_at: string;
  done: boolean;
  context?: number[];
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

interface OllamaChatResponse {
  message: {
    role: string;
    content: string;
  };
  model: string;
  created_at: string;
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  prompt_eval_duration?: number;
  eval_count?: number;
  eval_duration?: number;
}

export class OllamaProvider implements LLMProvider_Interface {
  name: 'ollama' = 'ollama';
  config: LLMConfig;
  private baseUrl: string;

  constructor(config: LLMConfig) {
    this.config = config;
    this.baseUrl = config.baseUrl || process.env.NEXT_PUBLIC_OLLAMA_BASE_URL || 'http://localhost:11434';
    
    console.log('Ollama provider initialized with base URL:', this.baseUrl);
    console.log('Ollama model:', config.model);
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Ollama connection...');
      
      // Test si Ollama est accessible
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Ollama server not accessible: ${response.status}`);
      }

      const data = await response.json();
      console.log('Available Ollama models:', data.models?.map((m: any) => m.name) || []);

      // Test de génération simple
      await this.generateResponse(SYSTEM_PROMPTS.CONNECTION_TEST);
      console.log('Ollama connection successful');
      return true;
      
    } catch (error) {
      console.error('Ollama connection failed:', error);
      return false;
    }
  }

  async generateResponse(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<LLMResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout pour Ollama

    try {
      const model = this.config.model || 'deepseek-r1:8b';
      
      // Utiliser l'API chat si un system prompt est fourni
      if (options?.systemPrompt) {
        const url = `${this.baseUrl}/api/chat`;
        const requestBody = {
          model: model,
          messages: [
            {
              role: 'system',
              content: options.systemPrompt
            },
            {
              role: 'user', 
              content: prompt
            }
          ],
          stream: false,
          options: {
            temperature: options?.temperature ?? this.config.temperature ?? 0.1,
            num_predict: options?.maxTokens ?? this.config.maxTokens ?? 1000,
            top_p: 0.8,
            top_k: 10
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama API error (${response.status}): ${errorText}`);
        }

        const data: OllamaChatResponse = await response.json();
        
        return {
          content: data.message.content,
          usage: data.prompt_eval_count && data.eval_count ? {
            promptTokens: data.prompt_eval_count,
            completionTokens: data.eval_count,
            totalTokens: data.prompt_eval_count + data.eval_count
          } : undefined,
          model: data.model,
          provider: 'ollama'
        };

      } else {
        // Utiliser l'API generate standard
        const url = `${this.baseUrl}/api/generate`;
        const requestBody = {
          model: model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: options?.temperature ?? this.config.temperature ?? 0.1,
            num_predict: options?.maxTokens ?? this.config.maxTokens ?? 1000,
            top_p: 0.8,
            top_k: 10
          }
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Ollama API error (${response.status}): ${errorText}`);
        }

        const data: OllamaResponse = await response.json();
        
        return {
          content: data.response,
          usage: data.prompt_eval_count && data.eval_count ? {
            promptTokens: data.prompt_eval_count,
            completionTokens: data.eval_count,
            totalTokens: data.prompt_eval_count + data.eval_count
          } : undefined,
          model: data.model,
          provider: 'ollama'
        };
      }

    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - L\'analyse Ollama a pris trop de temps');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async analyzeSection(
    sectionId: keyof BMCData,
    content: string,
    context: ProjectContext,
    otherSections: Partial<BMCData>
  ): Promise<AIAnalysis> {
    try {
      const prompt = buildAnalysisPrompt(sectionId, content, context, otherSections);
      
      // Utiliser l'approche avec system prompt pour une meilleure qualité
      const response = await this.generateResponse(prompt, {
        systemPrompt: `🇫🇷 Tu es un expert en Business Model Canvas. Réponds OBLIGATOIREMENT en FRANÇAIS avec un JSON valide:
{
  "errors": ["erreur en français 1", "erreur en français 2"],
  "suggestions": ["suggestion en français 1", "suggestion en français 2"],
  "score": 85,
  "examples": ["exemple en français 1", "exemple en français 2"]
}
INTERDIT: Aucun mot anglais dans ta réponse !`
      });

      // Parser la réponse JSON
      let jsonMatch = response.content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Fallback: chercher le JSON en début/fin de réponse
        const cleanContent = response.content.trim();
        if (cleanContent.startsWith('{') && cleanContent.includes('}')) {
          jsonMatch = [cleanContent];
        } else {
          throw new Error('No JSON found in Ollama response');
        }
      }

      let analysis;
      try {
        // Nettoyer les caractères de contrôle et problématiques
        let cleanedJson = jsonMatch[0]
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Supprimer les caractères de contrôle
          .replace(/\n\s*\n/g, '\n')           // Supprimer les lignes vides multiples
          .replace(/,(\s*[}\]])/g, '$1')       // Supprimer les virgules avant } ou ]
          .trim();
        
        analysis = JSON.parse(cleanedJson);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Original JSON:', jsonMatch[0]);
        
        // Tentative de récupération avec regex plus agressive
        try {
          const fallbackMatch = jsonMatch[0].match(/"errors":\s*\[(.*?)\]\s*,?\s*"suggestions":\s*\[(.*?)\]\s*,?\s*"score":\s*(\d+)\s*,?\s*"examples":\s*\[(.*?)\]/s);
          if (fallbackMatch) {
            analysis = {
              errors: fallbackMatch[1] ? fallbackMatch[1].split('","').map(s => s.replace(/^"|"$/g, '')) : [],
              suggestions: fallbackMatch[2] ? fallbackMatch[2].split('","').map(s => s.replace(/^"|"$/g, '')) : [],
              score: parseInt(fallbackMatch[3]) || 0,
              examples: fallbackMatch[4] ? fallbackMatch[4].split('","').map(s => s.replace(/^"|"$/g, '')) : []
            };
          } else {
            throw new Error('Could not recover JSON structure');
          }
        } catch (fallbackError) {
          throw new Error('Invalid JSON format from Ollama - unable to recover');
        }
      }
      
      // Vérification que la réponse est bien en français
      const allText = [
        ...(analysis.errors || []),
        ...(analysis.suggestions || []), 
        ...(analysis.examples || [])
      ].join(' ').toLowerCase();
      
      // Détection basique de mots anglais courants
      const englishWords = ['the', 'and', 'or', 'but', 'this', 'that', 'with', 'from', 'they', 'have', 'would', 'could', 'should', 'example', 'consider', 'feature', 'section', 'impact', 'business', 'customers'];
      const hasEnglish = englishWords.some(word => allText.includes(` ${word} `) || allText.includes(`${word} `) || allText.includes(` ${word}`));
      
      if (hasEnglish) {
        console.warn('⚠️ Ollama responded in English, requesting French response...');
        return {
          sectionId,
          errors: ['Réponse en anglais détectée - Merci de reformuler en français'],
          suggestions: ['Veuillez relancer l\'analyse pour obtenir une réponse en français'],
          score: 0,
          examples: ['L\'IA doit répondre uniquement en français pour une meilleure compréhension']
        };
      }
      
      return {
        sectionId,
        errors: analysis.errors || [],
        suggestions: analysis.suggestions || [],
        score: analysis.score || 0,
        examples: analysis.examples || []
      };

    } catch (error) {
      console.error('Ollama analysis error:', error);
      
      let errorMessage = 'Erreur d\'analyse Ollama';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Analyse Ollama timeout - Le modèle local prend trop de temps';
        } else if (error.message.includes('not accessible')) {
          errorMessage = 'Ollama non accessible - Vérifiez que le serveur local est démarré';
        } else if (error.message.includes('No JSON')) {
          errorMessage = 'Réponse Ollama malformée - Le modèle a du mal avec le JSON';
        } else if (error.message.includes('model')) {
          errorMessage = `Modèle ${this.config.model} non trouvé - Vérifiez qu'il est installé localement`;
        }
      }
      
      return {
        sectionId,
        errors: [errorMessage],
        suggestions: [
          'Vérifiez qu\'Ollama est démarré (ollama serve)',
          `Vérifiez que le modèle ${this.config.model} est installé`,
          'Réessayez l\'analyse'
        ],
        score: 0,
        examples: []
      };
    }
  }
}