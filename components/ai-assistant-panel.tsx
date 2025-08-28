'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AIAnalysis } from '@/types/bmc';
import { 
  Bot, 
  TrendingUp, 
  Target, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  X
} from 'lucide-react';

interface AIAssistantPanelProps {
  analyses: Record<string, AIAnalysis>;
  activeSection?: string;
  onClose?: () => void;
  isVisible: boolean;
}

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

export function AIAssistantPanel({ analyses, activeSection, onClose, isVisible }: AIAssistantPanelProps) {
  if (!isVisible) return null;

  const analysisEntries = Object.entries(analyses);
  const activeAnalysis = activeSection ? analyses[activeSection] : null;
  
  const overallScore = analysisEntries.length > 0 
    ? Math.round(analysisEntries.reduce((sum, [, analysis]) => sum + analysis.score, 0) / analysisEntries.length)
    : 0;

  const totalErrors = analysisEntries.reduce((sum, [, analysis]) => sum + analysis.errors.length, 0);
  const totalSuggestions = analysisEntries.reduce((sum, [, analysis]) => sum + analysis.suggestions.length, 0);

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-semibold">AI Assistant</h2>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Active Section */}
        {activeSection && (
          <div className="mb-3">
            <Badge variant="outline" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Section Active
            </Badge>
            <p className="text-sm font-medium mt-1">
              {sectionNames[activeSection as keyof typeof sectionNames]}
            </p>
          </div>
        )}

        {/* Overall Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-blue-600">{overallScore}%</div>
            <div className="text-xs text-gray-500">Score Global</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">{totalErrors}</div>
            <div className="text-xs text-gray-500">Erreurs</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">{totalSuggestions}</div>
            <div className="text-xs text-gray-500">Suggestions</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Active Section Analysis */}
        {activeAnalysis && (
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Analyse Détaillée
            </h3>
            
            <AnalysisCard analysis={activeAnalysis} />
          </div>
        )}

        {/* Market Insights */}
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Market Insights
          </h3>
          
          <div className="space-y-3">
            <InsightCard
              icon="📈"
              title="Market Trend"
              description="AI-powered solutions are seeing 40% growth in enterprise adoption"
            />
            <InsightCard
              icon="🎯"
              title="Competitive Analysis"
              description="Similar businesses focus on automation and cost reduction"
            />
            <InsightCard
              icon="💡"
              title="Opportunity"
              description="Consider subscription-based pricing for recurring revenue"
            />
            <InsightCard
              icon="💜"
              title="Pro Tip"
              description="Focus on your unique value proposition to differentiate from competitors in the market."
            />
          </div>
        </div>

        {/* All Sections Progress */}
        {analysisEntries.length > 0 && (
          <div className="p-4">
            <h3 className="font-semibold mb-3">Progrès par Section</h3>
            <div className="space-y-2">
              {analysisEntries.map(([sectionId, analysis]) => (
                <SectionProgress
                  key={sectionId}
                  name={sectionNames[sectionId as keyof typeof sectionNames]}
                  score={analysis.score}
                  errors={analysis.errors.length}
                  suggestions={analysis.suggestions.length}
                  isActive={sectionId === activeSection}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisCard({ analysis }: { analysis: AIAnalysis }) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className={`flex items-center justify-between p-2 rounded ${getScoreColor(analysis.score)}`}>
          <span className="text-sm font-medium">Score de Qualité</span>
          <span className="font-bold">{analysis.score}%</span>
        </div>

        {analysis.errors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-3 w-3" />
              Corrections ({analysis.errors.length})
            </h4>
            <div className="space-y-1">
              {analysis.errors.map((error, index) => (
                <p key={index} className="text-xs text-red-700 bg-red-50 p-2 rounded">
                  {error}
                </p>
              ))}
            </div>
          </div>
        )}

        {analysis.suggestions.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-blue-600">
              <Lightbulb className="h-3 w-3" />
              Suggestions ({analysis.suggestions.length})
            </h4>
            <div className="space-y-1">
              {analysis.suggestions.map((suggestion, index) => (
                <p key={index} className="text-xs text-blue-700 bg-blue-50 p-2 rounded">
                  {suggestion}
                </p>
              ))}
            </div>
          </div>
        )}

        {analysis.examples.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-1 text-green-600">
              <CheckCircle className="h-3 w-3" />
              Exemples
            </h4>
            <div className="space-y-1">
              {analysis.examples.map((example, index) => (
                <p key={index} className="text-xs text-green-700 bg-green-50 p-2 rounded">
                  {example}
                </p>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InsightCard({ icon, title, description }: { 
  icon: string; 
  title: string; 
  description: string; 
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <h4 className="text-sm font-medium">{title}</h4>
        <p className="text-xs text-gray-600 mt-1">{description}</p>
      </div>
    </div>
  );
}

function SectionProgress({ 
  name, 
  score, 
  errors, 
  suggestions, 
  isActive 
}: { 
  name: string; 
  score: number; 
  errors: number; 
  suggestions: number; 
  isActive: boolean;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className={`p-2 rounded-lg border ${isActive ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">{name}</span>
        <Badge variant="outline" className="text-xs">
          {score}%
        </Badge>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
        <div 
          className={`h-1.5 rounded-full ${getScoreColor(score)}`}
          style={{ width: `${score}%` }}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{errors} erreurs</span>
        <span>{suggestions} suggestions</span>
      </div>
    </div>
  );
}