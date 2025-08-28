import { ProjectContext, BMCData, AIAnalysis } from '@/types/bmc';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

export class GroqAnalyzer {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY || '';
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('Groq API key not found. Please set NEXT_PUBLIC_GROQ_API_KEY in your .env.local file');
    }
    console.log('Groq API Key loaded:', this.apiKey.substring(0, 10) + '...');
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing Groq API connection...');
      await this.callGroqAPI([{ role: 'user', content: 'Test' }]);
      console.log('Groq API connection successful');
      return true;
    } catch (error) {
      console.error('Groq API connection failed:', error);
      return false;
    }
  }

  private async callGroqAPI(messages: Array<{role: string, content: string}>): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages,
          temperature: 0.1,
          max_tokens: 1000,
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
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout - L\'analyse a pris trop de temps');
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
    const sectionNames = {
      keyPartners: 'Partenaires Clés',
      keyActivities: 'Activités Clés',
      valuePropositions: 'Propositions de Valeur',
      customerRelationships: 'Relations Clients',
      customerSegments: 'Segments de Clientèle',
      keyResources: 'Ressources Clés',
      channels: 'Canaux',
      costStructure: 'Structure des Coûts',
      revenueStreams: 'Flux de Revenus'
    };

    const prompt = `Tu es un expert en Business Model Canvas. 

CONTEXTE DU PROJET:
- Titre: ${context.titre}
- Description: ${context.description}
- Secteur: ${context.secteur}
- Stade: ${context.stade}

SECTION À ANALYSER: ${sectionNames[sectionId]}
CONTENU: "${content}"

AUTRES SECTIONS DU BMC:
${Object.entries(otherSections)
  .filter(([key, value]) => key !== sectionId && value)
  .map(([key, value]) => `- ${sectionNames[key as keyof BMCData]}: ${value}`)
  .join('\n')}

TÂCHES:
1. Identifie les erreurs grammaticales et de syntaxe
2. Détecte les incohérences avec les autres sections
3. Évalue la pertinence business (score 0-100)
4. Propose 2-3 suggestions d'amélioration avec exemples concrets
5. Donne des exemples spécifiques au secteur

RÉPONDS EN JSON:
{
  "errors": ["erreur1", "erreur2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "score": 85,
  "examples": ["exemple1", "exemple2"]
}`;

    try {
      const response = await this.callGroqAPI([
        { role: 'user', content: prompt }
      ]);

      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response from Groq');
      }

      const analysis = JSON.parse(jsonMatch[0]);
      
      return {
        sectionId,
        errors: analysis.errors || [],
        suggestions: analysis.suggestions || [],
        score: analysis.score || 0,
        examples: analysis.examples || []
      };
    } catch (error) {
      console.error('Groq analysis error:', error);
      
      let errorMessage = 'Erreur d\'analyse IA';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'Analyse IA timeout - Réessayez plus tard';
        } else if (error.message.includes('401')) {
          errorMessage = 'Clé API invalide - Vérifiez votre configuration';
        } else if (error.message.includes('429')) {
          errorMessage = 'Limite d\'API atteinte - Réessayez dans quelques minutes';
        } else if (error.message.includes('Invalid JSON')) {
          errorMessage = 'Réponse IA malformée - Réessayez';
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