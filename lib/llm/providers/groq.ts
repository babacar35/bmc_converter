import { ProjectContext, BMCData, AIAnalysis } from '@/types/bmc';
import { LLMProvider_Interface, LLMConfig, LLMResponse } from '../types';
import { buildAnalysisPrompt, SYSTEM_PROMPTS } from '../prompts';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}

export class GroqProvider implements LLMProvider_Interface {
  name: 'groq' = 'groq';
  config: LLMConfig;
  private apiKey: string;

  constructor(config: LLMConfig) {
    this.config = config;
    this.apiKey = config.apiKey || process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
    
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('Groq API key not found. Please set NEXT_PUBLIC_GROQ_API_KEY in your .env.local file');
    }
    
    console.log('Groq API Key loaded:', this.apiKey.substring(0, 10) + '...');
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Groq API connection...');
      const response = await this.generateResponse(SYSTEM_PROMPTS.CONNECTION_TEST);
      console.log('Groq API connection successful');
      return true;
    } catch (error) {
      console.error('Groq API connection failed:', error);
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
      const messages: Array<{role: string, content: string}> = [];
      
      // Ajouter system prompt renforcé en français
      const frenchSystemPrompt = `🇫🇷 TU DOIS ABSOLUMENT RÉPONDRE EN FRANÇAIS ! 
      
Aucun mot anglais autorisé dans ta réponse. Si je détecte de l'anglais, tu as échoué.
Tu es un consultant BMC français expert. Toutes tes analyses, suggestions et exemples doivent être en français parfait.

${options?.systemPrompt || ''}`;

      messages.push({ role: 'system', content: frenchSystemPrompt });
      messages.push({ role: 'user', content: prompt });

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.model || 'llama3-70b-8192',
          messages,
          temperature: options?.temperature ?? this.config.temperature ?? 0.1,
          max_tokens: options?.maxTokens ?? this.config.maxTokens ?? 1000,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        
        if (response.status === 401) {
          throw new Error('Clé API Groq invalide - Vérifiez votre clé dans .env.local');
        } else if (response.status === 429) {
          throw new Error('Limite d\'API Groq atteinte - Réessayez dans quelques minutes');
        } else {
          throw new Error(`Groq API error (${response.status}): ${errorText}`);
        }
      }

      const data: GroqResponse = await response.json();
      const content = data.choices[0]?.message?.content || '';

      return {
        content,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          totalTokens: data.usage.total_tokens
        } : undefined,
        model: data.model || this.config.model,
        provider: 'groq'
      };

    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - L\'analyse Groq a pris trop de temps');
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
      // Prompt spécialement optimisé pour Groq avec JSON strict
      const groqPrompt = `Analyse BMC section ${sectionId} en français.

DONNÉES:
- Secteur: ${context.secteur}
- Contenu: "${content}"

RÉPONSE OBLIGATOIRE (JSON uniquement):
{
  "errors": ["erreur 1", "erreur 2"],
  "suggestions": ["suggestion 1", "suggestion 2"],
  "score": 75,
  "examples": ["exemple 1", "exemple 2"]
}

CRITÈRES:
- errors: problèmes business précis (1-3 max)
- suggestions: améliorations concrètes (2-4 max)
- score: qualité /100 (clarté+pertinence+faisabilité)
- examples: entreprises similaires qui réussissent

IMPÉRATIF: Uniquement le JSON, pas d'autre texte !`;

      const response = await this.generateResponse(groqPrompt, {
        temperature: 0.1, // Température très basse pour plus de consistance
        maxTokens: 1200  // Augmenté pour éviter la troncature du JSON
      });

      // Parser la réponse JSON avec plus de robustesse
      console.log('🔍 Groq raw response:', response.content);
      
      // Nettoyer la réponse d'abord
      const cleanedResponse = response.content.trim();
      let jsonMatch = null;
      
      // 1. Vérifier si c'est déjà du JSON pur
      if (cleanedResponse.startsWith('{') && cleanedResponse.endsWith('}')) {
        jsonMatch = [cleanedResponse];
        console.log('✅ JSON found: pure JSON response');
      } else if (cleanedResponse.startsWith('{') && (cleanedResponse.includes('"examples"') || cleanedResponse.includes('"suggestions"'))) {
        // 2. JSON tronqué mais semble avoir du contenu - essayer de le compléter
        let potentialJson = cleanedResponse;
        
        // Compter les crochets et accolades pour voir ce qui manque
        const openBraces = (potentialJson.match(/\{/g) || []).length;
        const closeBraces = (potentialJson.match(/\}/g) || []).length;
        const openBrackets = (potentialJson.match(/\[/g) || []).length;
        const closeBrackets = (potentialJson.match(/\]/g) || []).length;
        
        console.log(`🔧 Brackets count: open={${openBraces}} close={${closeBraces}} open=[${openBrackets}] close=[${closeBrackets}]`);
        
        // Si la chaîne se termine au milieu d'un array ou d'une valeur, essayer de la compléter
        if (potentialJson.endsWith('"') || potentialJson.endsWith('",') || potentialJson.endsWith(', ')) {
          // Probablement coupé au milieu d'un string
          if (!potentialJson.endsWith('"')) {
            potentialJson += '"';
          }
        }
        
        // Ajouter les fermures manquantes si nécessaire
        for (let i = closeBrackets; i < openBrackets; i++) {
          potentialJson += ']';
        }
        for (let i = closeBraces; i < openBraces; i++) {
          potentialJson += '}';
        }
        
        jsonMatch = [potentialJson];
        console.log('✅ JSON found: completed truncated JSON');
        console.log('🔧 Completed JSON:', potentialJson);
      } else {
        // 3. Chercher JSON avec regex plus permissive
        const jsonRegex = /\{[\s\S]*?\}/;
        const match = cleanedResponse.match(jsonRegex);
        if (match) {
          jsonMatch = [match[0]];
          console.log('✅ JSON found: regex match');
        } else {
          // 3. Fallback: chercher JSON entre les balises de code
          const codeMatch = cleanedResponse.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (codeMatch) {
            jsonMatch = [codeMatch[1]];
            console.log('✅ JSON found: code block');
          } else {
            // 4. Fallback plus agressif: extraire tout ce qui ressemble à du JSON
            const jsonLikeMatch = cleanedResponse.match(/\{\s*["']?(?:errors|suggestions|score|examples)["']?[\s\S]*?\}/);
            if (jsonLikeMatch) {
              jsonMatch = [jsonLikeMatch[0]];
              console.log('✅ JSON found: aggressive pattern match');
            } else {
              console.error('❌ No JSON found in Groq response:', response.content);
              
              // Créer une analyse d'erreur par défaut
              return {
                sectionId,
                errors: ['Réponse Groq malformée - Impossible de parser le JSON'],
                suggestions: ['Réessayez l\'analyse ou changez de provider'],
                score: 0,
                examples: []
              };
            }
          }
        }
      }

      let analysis;
      try {
        console.log('🧹 Raw JSON to clean:', jsonMatch[0]);
        
        // Nettoyer les caractères de contrôle et problématiques
        let cleanedJson = jsonMatch[0]
          .replace(/[\x00-\x1F\x7F-\x9F]/g, '') // Supprimer les caractères de contrôle
          .replace(/\n\s*\n/g, '\n')           // Supprimer les lignes vides multiples
          .replace(/,(\s*[}\]])/g, '$1')       // Supprimer les virgules avant } ou ]
          .trim();
        
        console.log('🧹 Cleaned JSON:', cleanedJson);
        
        analysis = JSON.parse(cleanedJson);
        console.log('✅ JSON parsed successfully:', analysis);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Original JSON:', jsonMatch[0]);
        console.error('Cleaned JSON:', cleanedJson);
        
        // Tentative de récupération avec regex plus agressive
        try {
          // Essayer différentes approches de parsing
          const patterns = [
            // Pattern standard
            /"errors":\s*\[(.*?)\]\s*,?\s*"suggestions":\s*\[(.*?)\]\s*,?\s*"score":\s*(\d+)\s*,?\s*"examples":\s*\[(.*?)\]/s,
            // Pattern avec ordre différent
            /"score":\s*(\d+)\s*,?\s*"errors":\s*\[(.*?)\]\s*,?\s*"suggestions":\s*\[(.*?)\]\s*,?\s*"examples":\s*\[(.*?)\]/s,
            // Pattern minimal (score + errors seulement)
            /"errors":\s*\[(.*?)\]\s*.*?"score":\s*(\d+)/s
          ];

          let recovered = false;
          for (const pattern of patterns) {
            const fallbackMatch = jsonMatch[0].match(pattern);
            if (fallbackMatch) {
              if (pattern === patterns[0]) {
                // Pattern standard
                analysis = {
                  errors: fallbackMatch[1] ? fallbackMatch[1].split('","').map(s => s.replace(/^"|"$/g, '').trim()).filter(s => s) : [],
                  suggestions: fallbackMatch[2] ? fallbackMatch[2].split('","').map(s => s.replace(/^"|"$/g, '').trim()).filter(s => s) : [],
                  score: parseInt(fallbackMatch[3]) || 0,
                  examples: fallbackMatch[4] ? fallbackMatch[4].split('","').map(s => s.replace(/^"|"$/g, '').trim()).filter(s => s) : []
                };
              } else if (pattern === patterns[1]) {
                // Pattern avec ordre différent
                analysis = {
                  score: parseInt(fallbackMatch[1]) || 0,
                  errors: fallbackMatch[2] ? fallbackMatch[2].split('","').map(s => s.replace(/^"|"$/g, '').trim()).filter(s => s) : [],
                  suggestions: fallbackMatch[3] ? fallbackMatch[3].split('","').map(s => s.replace(/^"|"$/g, '').trim()).filter(s => s) : [],
                  examples: fallbackMatch[4] ? fallbackMatch[4].split('","').map(s => s.replace(/^"|"$/g, '').trim()).filter(s => s) : []
                };
              } else if (pattern === patterns[2]) {
                // Pattern minimal
                analysis = {
                  errors: fallbackMatch[1] ? fallbackMatch[1].split('","').map(s => s.replace(/^"|"$/g, '').trim()).filter(s => s) : [],
                  suggestions: ['Réponse partielle - Réessayez pour plus de suggestions'],
                  score: parseInt(fallbackMatch[2]) || 0,
                  examples: []
                };
              }
              recovered = true;
              console.log('✅ Recovered JSON with pattern:', pattern);
              break;
            }
          }

          if (!recovered) {
            // Si aucun pattern ne fonctionne, créer une analyse par défaut
            console.error('❌ Could not recover JSON structure from:', jsonMatch[0]);
            
            // Tentative ultime : extraire manuellement quelques éléments
            const textContent = response.content;
            const basicAnalysis = {
              sectionId,
              errors: ['Réponse Groq incompréhensible - Format JSON invalide'],
              suggestions: ['Réessayez l\'analyse ou utilisez un autre provider'],
              score: 0,
              examples: []
            };
            
            // Essayer d'extraire au moins le score s'il y en a un
            const scoreMatch = textContent.match(/"score":\s*(\d+)/);
            if (scoreMatch) {
              basicAnalysis.score = parseInt(scoreMatch[1]) || 0;
            }
            
            return basicAnalysis;
          }
        } catch (fallbackError) {
          console.error('❌ Fallback parsing failed:', fallbackError);
          return {
            sectionId,
            errors: ['Erreur critique de parsing Groq - JSON corrompu'],
            suggestions: ['Réessayez l\'analyse ou changez de provider IA'],
            score: 0,
            examples: []
          };
        }
      }
      
      // Log pour diagnostic si nécessaire
      // console.log('🔍 Groq raw response:', response.content);
      // console.log('🔍 JSON match:', jsonMatch?.[0]);
      
      // Vérification que la réponse est bien en français (DÉSACTIVÉE TEMPORAIREMENT)
      // const allText = [
      //   ...(analysis.errors || []),
      //   ...(analysis.suggestions || []), 
      //   ...(analysis.examples || [])
      // ].join(' ').toLowerCase();
      
      // // Détection de mots anglais problématiques uniquement
      // const problematicWords = ['the value proposition', 'consider adding', 'for example', 'this will help', 'you should', 'it would be better'];
      // const hasEnglish = problematicWords.some(phrase => allText.includes(phrase));
      
      // if (hasEnglish) {
      //   console.warn('⚠️ Groq responded in English, requesting French response...');
      //   return {
      //     sectionId,
      //     errors: ['Réponse en anglais détectée - Merci de reformuler en français'],
      //     suggestions: ['Veuillez relancer l\'analyse pour obtenir une réponse en français'],
      //     score: 0,
      //     examples: ['L\'IA doit répondre uniquement en français pour une meilleure compréhension']
      //   };
      // }
      
      // Vérification finale de la structure de l'analyse
      if (!analysis || typeof analysis !== 'object') {
        console.error('❌ Analysis is not a valid object:', analysis);
        return {
          sectionId,
          errors: ['Analyse Groq invalide - Structure incorrecte'],
          suggestions: ['Réessayez l\'analyse'],
          score: 0,
          examples: []
        };
      }
      
      // Normaliser la réponse pour garantir les types corrects
      const normalizedAnalysis = {
        sectionId,
        errors: Array.isArray(analysis.errors) ? analysis.errors.filter(e => typeof e === 'string' && e.trim()) : [],
        suggestions: Array.isArray(analysis.suggestions) ? analysis.suggestions.filter(s => typeof s === 'string' && s.trim()) : [],
        score: typeof analysis.score === 'number' ? Math.max(0, Math.min(100, analysis.score)) : 0,
        examples: Array.isArray(analysis.examples) ? analysis.examples.filter(e => typeof e === 'string' && e.trim()) : []
      };
      
      console.log('✅ Final normalized analysis:', normalizedAnalysis);
      return normalizedAnalysis;

    } catch (error) {
      console.error('Groq analysis error:', error);
      
      let errorMessage = 'Erreur d\'analyse Groq';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Analyse Groq timeout - Réessayez plus tard';
        } else if (error.message.includes('401')) {
          errorMessage = 'Clé API Groq invalide - Vérifiez votre configuration';
        } else if (error.message.includes('429')) {
          errorMessage = 'Limite d\'API Groq atteinte - Réessayez dans quelques minutes';
        } else if (error.message.includes('Invalid JSON')) {
          errorMessage = 'Réponse Groq malformée - Réessayez';
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