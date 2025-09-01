import { ProjectContext, BMCData, AIAnalysis } from '@/types/bmc';

export type LLMProvider = 'groq' | 'gemini' | 'ollama';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey?: string;
  model: string;
  baseUrl?: string; // Pour Ollama
  temperature?: number;
  maxTokens?: number;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  provider: LLMProvider;
}

export interface LLMProvider_Interface {
  name: LLMProvider;
  config: LLMConfig;
  
  // Test de connexion
  testConnection(): Promise<boolean>;
  
  // Génération de réponse
  generateResponse(
    prompt: string,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<LLMResponse>;
  
  // Analyse spécifique BMC
  analyzeSection(
    sectionId: keyof BMCData,
    content: string,
    context: ProjectContext,
    otherSections: Partial<BMCData>
  ): Promise<AIAnalysis>;
}

export interface ProviderStatus {
  provider: LLMProvider;
  available: boolean;
  error?: string;
  latency?: number;
}

// Configuration des modèles par provider
export const PROVIDER_MODELS = {
  groq: [
    'llama3-70b-8192',
    'mixtral-8x7b-32768', 
    'llama3-8b-8192',
    'gemma2-9b-it'
  ],
  gemini: [
    'gemini-1.5-pro',
    'gemini-1.5-flash',
    'gemini-1.0-pro'
  ],
  ollama: [
    'deepseek-r1:8b',     // Modèle par défaut - excellent pour l'analyse
    'gemma3:12b',         // Modèle le plus puissant - qualité maximale
    'mistral:latest',     // Bon équilibre vitesse/qualité
    'llama3:8b'           // Modèle Meta stable et rapide
  ]
} as const;

export type ProviderModel<T extends LLMProvider> = typeof PROVIDER_MODELS[T][number];