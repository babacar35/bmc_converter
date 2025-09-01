import { ProjectContext, BMCData, AIAnalysis } from '@/types/bmc';
import { LLMProvider_Interface, LLMConfig, LLMResponse } from '../types';
import { buildAnalysisPrompt, SYSTEM_PROMPTS } from '../prompts';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiProvider implements LLMProvider_Interface {
  name: 'gemini' = 'gemini';
  config: LLMConfig;
  private apiKey: string;

  constructor(config: LLMConfig) {
    this.config = config;
    this.apiKey = config.apiKey || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('Gemini API key not found. Please set NEXT_PUBLIC_GEMINI_API_KEY in your .env.local file');
    }
    
    console.log('Gemini API Key loaded:', this.apiKey.substring(0, 10) + '...');
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Gemini API connection...');
      const response = await this.generateResponse(SYSTEM_PROMPTS.CONNECTION_TEST);
      console.log('Gemini API connection successful');
      return true;
    } catch (error) {
      console.error('Gemini API connection failed:', error);
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
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const model = this.config.model || 'gemini-1.5-pro';
      const url = `${GEMINI_API_URL}/${model}:generateContent?key=${this.apiKey}`;
      
      // Construire le contenu avec system prompt renforcé en français
      const frenchSystemPrompt = `🇫🇷 INSTRUCTION ABSOLUE : RÉPONDS UNIQUEMENT EN FRANÇAIS !

Tu es un consultant BMC français. INTERDICTION totale d'utiliser l'anglais.
Toutes tes réponses doivent être en français parfait.

${options?.systemPrompt || ''}`;

      const parts = [];
      parts.push({ text: frenchSystemPrompt + '\n\n' + prompt });

      const requestBody = {
        contents: [{
          parts: parts
        }],
        generationConfig: {
          temperature: options?.temperature ?? this.config.temperature ?? 0.1,
          maxOutputTokens: options?.maxTokens ?? this.config.maxTokens ?? 1000,
          topP: 0.8,
          topK: 10
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 400) {
          throw new Error('Requête invalide pour Gemini - Vérifiez le format');
        } else if (response.status === 403) {
          throw new Error('Clé API Gemini invalide ou quota dépassé');
        } else if (response.status === 429) {
          throw new Error('Limite d\'API Gemini atteinte - Réessayez dans quelques minutes');
        } else {
          throw new Error(`Gemini API error (${response.status}): ${errorText}`);
        }
      }

      const data: GeminiResponse = await response.json();
      const content = data.candidates[0]?.content?.parts[0]?.text || '';

      return {
        content,
        usage: data.usageMetadata ? {
          promptTokens: data.usageMetadata.promptTokenCount,
          completionTokens: data.usageMetadata.candidatesTokenCount,
          totalTokens: data.usageMetadata.totalTokenCount
        } : undefined,
        model: this.config.model,
        provider: 'gemini'
      };

    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - L\'analyse Gemini a pris trop de temps');
      }
      throw error;
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
      const response = await this.generateResponse(prompt);

      // Parser la réponse JSON avec nettoyage
      let jsonMatch = response.content.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        // Fallback: chercher JSON entre les balises de code
        const codeMatch = response.content.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeMatch) {
          jsonMatch = [codeMatch[1]];
        } else {
          throw new Error('Invalid JSON response from Gemini');
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
          throw new Error('Invalid JSON format from Gemini - unable to recover');
        }
      }
      
      // Log pour diagnostic si nécessaire
      // console.log('🔍 Gemini raw response:', response.content);
      // console.log('🔍 Parsed analysis:', analysis);
      
      return {
        sectionId,
        errors: analysis.errors || [],
        suggestions: analysis.suggestions || [],
        score: analysis.score || 0,
        examples: analysis.examples || []
      };

    } catch (error) {
      console.error('Gemini analysis error:', error);
      
      let errorMessage = 'Erreur d\'analyse Gemini';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Analyse Gemini timeout - Réessayez plus tard';
        } else if (error.message.includes('403')) {
          errorMessage = 'Clé API Gemini invalide - Vérifiez votre configuration';
        } else if (error.message.includes('429')) {
          errorMessage = 'Limite d\'API Gemini atteinte - Réessayez dans quelques minutes';
        } else if (error.message.includes('Invalid JSON')) {
          errorMessage = 'Réponse Gemini malformée - Réessayez';
        }
      }
      
      return {
        sectionId,
        errors: [errorMessage],
        suggestions: ['Réessayez l\'analyse ou vérifiez votre connexion internet'],
        score: 0,
        examples: []
      };
    }
  }
}