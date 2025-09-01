// Export des types principaux
export type { 
  LLMProvider, 
  LLMConfig, 
  LLMResponse, 
  LLMProvider_Interface,
  ProviderStatus,
  ProviderModel
} from './types';

export { 
  PROVIDER_MODELS 
} from './types';

// Export des providers
export { GroqProvider } from './providers/groq';
export { GeminiProvider } from './providers/gemini';  
export { OllamaProvider } from './providers/ollama';

// Export des prompts
export { 
  SYSTEM_PROMPTS,
  BMC_SECTION_NAMES,
  SECTION_ANALYSIS_INSTRUCTIONS,
  buildAnalysisPrompt,
  ANALYSIS_PROMPTS,
  PROVIDER_PROMPT_CONFIG
} from './prompts';

// Export du manager principal
export { LLMManager } from './manager';