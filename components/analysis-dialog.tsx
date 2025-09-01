'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Bot, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb, 
  Building2,
  X
} from 'lucide-react';
import { AIAnalysis } from '@/types/bmc';
import { LLMProvider } from '@/lib/llm';

interface AnalysisDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isAnalyzing: boolean;
  analysis: AIAnalysis | null;
  sectionName: string;
  content: string;
  provider: LLMProvider;
  onStartAnalysis: () => void;
}

const PROVIDER_NAMES = {
  groq: 'Groq',
  gemini: 'Google Gemini',
  ollama: 'Ollama'
} as const;

export function AnalysisDialog({
  isOpen,
  onClose,
  isAnalyzing,
  analysis,
  sectionName,
  content,
  provider,
  onStartAnalysis
}: AnalysisDialogProps) {
  const [progress, setProgress] = useState(0);

  // Animation du progress pendant l'analyse
  useState(() => {
    if (isAnalyzing) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return 90;
          return prev + Math.random() * 10;
        });
      }, 500);
      return () => clearInterval(interval);
    } else {
      setProgress(0);
    }
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bot className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg">
                  Analyse IA - {sectionName}
                </DialogTitle>
                <DialogDescription>
                  Powered by {PROVIDER_NAMES[provider]}
                </DialogDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contenu analysé */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Contenu analysé:</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {content || 'Aucun contenu à analyser'}
            </p>
          </div>

          {/* État d'analyse */}
          {isAnalyzing && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">
                    Analyse en cours...
                  </div>
                  <div className="text-xs text-gray-500">
                    L'IA analyse votre contenu avec {PROVIDER_NAMES[provider]}
                  </div>
                </div>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          {/* Résultats d'analyse */}
          {analysis && !isAnalyzing && (
            <div className="space-y-6">
              {/* Score */}
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Score de qualité</div>
                    <div className="text-xs text-gray-500">Évaluation globale</div>
                  </div>
                </div>
                <Badge 
                  variant="outline" 
                  className={`text-lg px-3 py-1 ${getScoreColor(analysis.score)}`}
                >
                  {analysis.score}%
                </Badge>
              </div>

              {/* Erreurs */}
              {analysis.errors.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <h4 className="font-medium text-red-900">
                      Points d'amélioration ({analysis.errors.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.errors.map((error, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <p className="text-sm text-red-800 leading-relaxed">
                          {error}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {analysis.suggestions.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">
                      Suggestions d'amélioration ({analysis.suggestions.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.suggestions.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <p className="text-sm text-blue-800 leading-relaxed">
                          {suggestion}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exemples */}
              {analysis.examples.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-green-900">
                      Exemples d'entreprises ({analysis.examples.length})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {analysis.examples.map((example, index) => (
                      <div 
                        key={index}
                        className="p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <p className="text-sm text-green-800 leading-relaxed">
                          {example}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            {!analysis && !isAnalyzing && content && (
              <Button 
                onClick={onStartAnalysis}
                className="flex-1"
              >
                <Bot className="h-4 w-4 mr-2" />
                Démarrer l'analyse
              </Button>
            )}
            
            {analysis && !isAnalyzing && (
              <Button 
                onClick={onStartAnalysis}
                variant="outline"
                className="flex-1"
              >
                <Bot className="h-4 w-4 mr-2" />
                Nouvelle analyse
              </Button>
            )}
            
            <Button 
              variant="secondary"
              onClick={onClose}
              className="min-w-[100px]"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}