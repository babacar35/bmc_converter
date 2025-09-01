"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Brain,
  Zap,
  Monitor,
  CheckCircle,
  XCircle,
  Loader2,
  Settings,
} from "lucide-react";
import { LLMProvider, ProviderStatus, PROVIDER_MODELS } from "@/lib/llm";

interface LLMProviderSelectorProps {
  currentProvider: LLMProvider;
  providersStatus: ProviderStatus[];
  onProviderChange: (provider: LLMProvider) => void;
  onModelChange?: (provider: LLMProvider, model: string) => void;
  currentModels?: Partial<Record<LLMProvider, string>>;
  isLoadingProviders?: boolean;
}

const PROVIDER_INFO = {
  groq: {
    name: "Groq",
    icon: Zap,
    description: "Ultra-rapide avec Llama 3.1",
    color: "text-orange-600",
    bgColor: "bg-orange-100",
    features: ["Très rapide", "Modèles récents", "API stable"],
  },
  gemini: {
    name: "Google Gemini",
    icon: Brain,
    description: "IA multimodale de Google",
    color: "text-blue-600",
    bgColor: "bg-blue-100",
    features: ["Multimodal", "Contexte long", "Très intelligent"],
  },
  ollama: {
    name: "Ollama (Local)",
    icon: Monitor,
    description: "DeepSeek R1 • Gemma3 12B • Mistral • Llama3",
    color: "text-green-600",
    bgColor: "bg-green-100",
    features: ["100% privé", "Pas de coûts", "Chargement rapide"],
  },
} as const;

export function LLMProviderSelector({
  currentProvider,
  providersStatus,
  onProviderChange,
  onModelChange,
  currentModels = {},
  isLoadingProviders = false,
}: LLMProviderSelectorProps) {
  const [isLoading, setIsLoading] = useState<LLMProvider | null>(null);

  const handleProviderSwitch = async (provider: LLMProvider) => {
    const status = providersStatus.find((p) => p.provider === provider);
    if (!status?.available) return;

    setIsLoading(provider);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Petit délai pour l'UX
    onProviderChange(provider);
    setIsLoading(null);
  };

  const handleModelChange = (provider: LLMProvider, model: string) => {
    if (onModelChange) {
      onModelChange(provider, model);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <CardTitle className="text-lg">Provider IA</CardTitle>
        </div>
        <CardDescription>
          Choisissez votre moteur d&apos;analyse Intelligence Artificielle
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Loading State */}
        {isLoadingProviders && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-blue-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Chargement des providers IA...</span>
            </div>
          </div>
        )}

        {/* Providers Grid */}
        {!isLoadingProviders && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {providersStatus.map((status) => {
                const provider = status.provider;
                const info = PROVIDER_INFO[provider];
                const isActive = provider === currentProvider;
                const isAvailable = status.available;
                const Icon = info.icon;

                return (
                  <Card
                    key={provider}
                    className={`cursor-pointer transition-all duration-200 ${
                      isActive
                        ? 'ring-2 ring-blue-500 shadow-md'
                        : isAvailable
                          ? 'hover:shadow-sm border-gray-200'
                          : 'opacity-50 cursor-not-allowed'
                    }`}
                    onClick={() => isAvailable && handleProviderSwitch(provider)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${info.bgColor}`}>
                          {isLoading === provider ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Icon className={`h-5 w-5 ${info.color}`} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-sm">{info.name}</h3>
                            {isAvailable ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            {isActive && (
                              <Badge variant="default" className="text-xs">Actif</Badge>
                            )}
                          </div>

                          <p className="text-xs text-gray-600 mb-2">{info.description}</p>

                          {/* Status ou latence */}
                          {isAvailable ? (
                            <div className="flex items-center gap-1 text-xs text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              {status.latency ? `${status.latency}ms` : 'Connecté'}
                            </div>
                          ) : (
                            <div className="text-xs text-red-600">{status.error}</div>
                          )}

                          {/* Features */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {info.features.slice(0, 2).map((feature) => (
                              <Badge key={feature} variant="secondary" className="text-xs px-1.5 py-0.5">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Model Selection pour le provider actif */}
            {currentProvider && providersStatus.find(p => p.provider === currentProvider)?.available && (
              <div className="border-t pt-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">
                    Modèle {PROVIDER_INFO[currentProvider].name}
                  </label>
                  
                  {/* Si Ollama, afficher la dropdown de sélection */}
                  {currentProvider === 'ollama' ? (
                    <Select
                      value={currentModels[currentProvider] || PROVIDER_MODELS[currentProvider][0]}
                      onValueChange={(value) => onModelChange?.(currentProvider, value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVIDER_MODELS[currentProvider].map((model) => (
                          <SelectItem key={model} value={model}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">
                                {model === 'deepseek-r1:8b' && '🧠 DeepSeek R1 8B'}
                                {model === 'gemma3:12b' && '⚡ Gemma3 12B'}
                                {model === 'mistral:latest' && '🔥 Mistral'}
                                {model === 'llama3:8b' && '🦙 Llama3 8B'}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {model === 'deepseek-r1:8b' && 'Raisonnement'}
                                {model === 'gemma3:12b' && 'Qualité max'}
                                {model === 'mistral:latest' && 'Équilibré'}
                                {model === 'llama3:8b' && 'Rapide'}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    /* Pour les autres providers, afficher juste le modèle */
                    <Badge variant="outline" className="text-sm">
                      {currentModels[currentProvider] || PROVIDER_MODELS[currentProvider][0]}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Info du provider actuel */}
            {currentProvider && providersStatus.find(p => p.provider === currentProvider)?.available && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Utilisation: {PROVIDER_INFO[currentProvider].name}
                  </span>
                </div>
                <p className="text-xs text-blue-700">
                  Toutes vos analyses BMC utiliseront ce provider.
                  {currentProvider === 'ollama' && ' Vos données restent privées sur votre machine.'}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
   
  );
}
