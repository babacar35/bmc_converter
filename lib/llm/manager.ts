import { ProjectContext, BMCData, AIAnalysis } from '@/types/bmc';
import { 
  LLMProvider, 
  LLMConfig, 
  LLMProvider_Interface, 
  LLMResponse, 
  ProviderStatus,
  PROVIDER_MODELS
} from './types';
import { GroqProvider } from './providers/groq';
import { GeminiProvider } from './providers/gemini';
import { OllamaProvider } from './providers/ollama';

export class LLMManager {
  private providers: Map<LLMProvider, LLMProvider_Interface> = new Map();
  private currentProvider: LLMProvider;
  private fallbackOrder: LLMProvider[] = ['ollama', 'groq', 'gemini']; // Ollama en premier (local et gratuit)

  constructor(defaultProvider: LLMProvider = 'ollama') {
    this.currentProvider = defaultProvider;
  }

  // Initialiser un provider
  async initializeProvider(provider: LLMProvider, config: LLMConfig): Promise<boolean> {
    try {
      let providerInstance: LLMProvider_Interface;

      switch (provider) {
        case 'groq':
          providerInstance = new GroqProvider(config);
          break;
        case 'gemini':
          providerInstance = new GeminiProvider(config);
          break;
        case 'ollama':
          providerInstance = new OllamaProvider(config);
          break;
        default:
          throw new Error(`Provider ${provider} not supported`);
      }

      // Test de connexion
      const isConnected = await providerInstance.testConnection();
      if (isConnected) {
        this.providers.set(provider, providerInstance);
        console.log(`✅ Provider ${provider} initialized successfully`);
        return true;
      } else {
        console.warn(`⚠️ Provider ${provider} failed connection test`);
        return false;
      }
    } catch (error) {
      console.error(`❌ Failed to initialize provider ${provider}:`, error);
      return false;
    }
  }

  // Initialiser tous les providers avec configuration depuis l'environnement
  async initializeAllProviders(): Promise<ProviderStatus[]> {
    const results: ProviderStatus[] = [];
    
    // Accès direct aux variables d'environnement Next.js
    const groqKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const geminiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const ollamaUrl = process.env.NEXT_PUBLIC_OLLAMA_BASE_URL;

    console.log('🔍 Environment variables check:', {
      groqKey: groqKey ? `${groqKey.slice(0, 10)}...` : 'not found',
      geminiKey: geminiKey ? `${geminiKey.slice(0, 10)}...` : 'not found',
      ollamaUrl: ollamaUrl || 'not configured'
    });
    
    // Configuration Groq
    if (groqKey && groqKey.trim()) {
      const startTime = Date.now();
      const success = await this.initializeProvider('groq', {
        provider: 'groq',
        apiKey: groqKey,
        model: 'llama3-8b-8192',
        temperature: 0.1,
        maxTokens: 1000
      });
      results.push({
        provider: 'groq',
        available: success,
        latency: success ? Date.now() - startTime : undefined,
        error: success ? undefined : 'Failed to connect or authenticate'
      });
    } else {
      results.push({
        provider: 'groq',
        available: false,
        error: 'API key not configured'
      });
    }

    // Configuration Gemini
    if (geminiKey && geminiKey.trim()) {
      const startTime = Date.now();
      const success = await this.initializeProvider('gemini', {
        provider: 'gemini',
        apiKey: geminiKey,
        model: 'gemini-1.5-flash',
        temperature: 0.1,
        maxTokens: 1000
      });
      results.push({
        provider: 'gemini',
        available: success,
        latency: success ? Date.now() - startTime : undefined,
        error: success ? undefined : 'Failed to connect or authenticate'
      });
    } else {
      results.push({
        provider: 'gemini',
        available: false,
        error: 'API key not configured'
      });
    }

    // Configuration Ollama (toujours tenté car local)
    const startTime = Date.now();
    const ollamaSuccess = await this.initializeProvider('ollama', {
      provider: 'ollama',
      model: 'deepseek-r1:8b', // Modèle par défaut mis à jour
      baseUrl: ollamaUrl || 'http://localhost:11434',
      temperature: 0.1,
      maxTokens: 1200 // Augmenté pour les modèles plus puissants
    });
    results.push({
      provider: 'ollama',
      available: ollamaSuccess,
      latency: ollamaSuccess ? Date.now() - startTime : undefined,
      error: ollamaSuccess ? undefined : 'Ollama server not accessible'
    });

    // Définir le provider par défaut (le premier disponible)
    const availableProvider = results.find(r => r.available)?.provider;
    if (availableProvider) {
      this.currentProvider = availableProvider;
      console.log(`🎯 Default provider set to: ${availableProvider}`);
    } else {
      console.warn('⚠️ No providers available');
    }

    console.log('📊 LLM Manager initialization completed:', {
      available: results.filter(r => r.available).map(r => r.provider),
      defaultProvider: this.currentProvider
    });

    return results;
  }

  // Switcher de provider
  switchProvider(provider: LLMProvider): boolean {
    if (!this.providers.has(provider)) {
      console.error(`Provider ${provider} not initialized`);
      return false;
    }
    
    this.currentProvider = provider;
    console.log(`🔄 Switched to provider: ${provider}`);
    return true;
  }

  // Obtenir le provider actuel
  getCurrentProvider(): LLMProvider {
    return this.currentProvider;
  }

  // Obtenir la liste des providers disponibles
  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.keys());
  }

  // Obtenir les modèles disponibles pour un provider
  getAvailableModels(provider: LLMProvider): string[] {
    return [...PROVIDER_MODELS[provider]];
  }

  // Mettre à jour le modèle d'un provider (spécifiquement pour Ollama)
  async updateProviderModel(provider: LLMProvider, model: string): Promise<boolean> {
    const existingProvider = this.providers.get(provider);
    if (!existingProvider) {
      console.warn(`Provider ${provider} not initialized`);
      return false;
    }

    // Créer une nouvelle configuration avec le nouveau modèle
    const newConfig = {
      ...existingProvider.config,
      model: model
    };

    // Réinitialiser le provider avec le nouveau modèle
    return await this.initializeProvider(provider, newConfig);
  }

  // Obtenir le status de tous les providers
  getProvidersStatus(): ProviderStatus[] {
    return this.fallbackOrder.map(provider => ({
      provider,
      available: this.providers.has(provider),
      error: this.providers.has(provider) ? undefined : 'Not initialized'
    }));
  }

  // Génération de réponse avec fallback automatique
  async generateResponse(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      preferredProvider?: LLMProvider;
      enableFallback?: boolean;
    }
  ): Promise<LLMResponse> {
    const provider = options?.preferredProvider || this.currentProvider;
    const enableFallback = options?.enableFallback ?? true;

    // Essayer le provider principal
    if (this.providers.has(provider)) {
      try {
        const providerInstance = this.providers.get(provider)!;
        return await providerInstance.generateResponse(prompt, options);
      } catch (error) {
        console.error(`Provider ${provider} failed:`, error);
        
        if (!enableFallback) {
          throw error;
        }
      }
    }

    // Fallback sur d'autres providers si activé
    if (enableFallback) {
      for (const fallbackProvider of this.fallbackOrder) {
        if (fallbackProvider !== provider && this.providers.has(fallbackProvider)) {
          try {
            console.log(`🔄 Falling back to ${fallbackProvider}`);
            const providerInstance = this.providers.get(fallbackProvider)!;
            return await providerInstance.generateResponse(prompt, options);
          } catch (error) {
            console.error(`Fallback provider ${fallbackProvider} also failed:`, error);
            continue;
          }
        }
      }
    }

    throw new Error('All providers failed or no providers available');
  }

  // Analyse de section BMC avec fallback
  async analyzeSection(
    sectionId: keyof BMCData,
    content: string,
    context: ProjectContext,
    otherSections: Partial<BMCData>,
    options?: {
      preferredProvider?: LLMProvider;
      enableFallback?: boolean;
    }
  ): Promise<AIAnalysis> {
    const provider = options?.preferredProvider || this.currentProvider;
    const enableFallback = options?.enableFallback ?? true;

    // Essayer le provider principal
    if (this.providers.has(provider)) {
      try {
        const providerInstance = this.providers.get(provider)!;
        return await providerInstance.analyzeSection(sectionId, content, context, otherSections);
      } catch (error) {
        console.error(`Provider ${provider} analysis failed:`, error);
        
        if (!enableFallback) {
          throw error;
        }
      }
    }

    // Fallback sur d'autres providers si activé
    if (enableFallback) {
      for (const fallbackProvider of this.fallbackOrder) {
        if (fallbackProvider !== provider && this.providers.has(fallbackProvider)) {
          try {
            console.log(`🔄 Analysis falling back to ${fallbackProvider}`);
            const providerInstance = this.providers.get(fallbackProvider)!;
            return await providerInstance.analyzeSection(sectionId, content, context, otherSections);
          } catch (error) {
            console.error(`Fallback provider ${fallbackProvider} analysis also failed:`, error);
            continue;
          }
        }
      }
    }

    // Retourner une analyse d'erreur si tous les providers ont échoué
    return {
      sectionId,
      errors: ['Tous les providers LLM ont échoué - Vérifiez votre configuration'],
      suggestions: [
        'Vérifiez vos clés API dans .env.local',
        'Vérifiez que Ollama est démarré si vous l\'utilisez',
        'Vérifiez votre connexion internet'
      ],
      score: 0,
      examples: []
    };
  }

  // Nettoyer les ressources
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up LLM Manager...');
    this.providers.clear();
  }
}