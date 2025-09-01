'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ProjectData } from '@/types/bmc';
import { LLMProvider, ProviderStatus } from '@/lib/llm';
import { LLMProviderSelector } from '@/components/llm-provider-selector';
import { 
  Plus, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Users,
  Import,
  BookOpen
} from 'lucide-react';

interface DashboardHomeProps {
  recentProjects: ProjectData[];
  onNewProject: () => void;
  onOpenProject: (project: ProjectData) => void;
  onImportProject: () => void;
  onResetDemo?: () => void;
  // LLM Provider props
  currentProvider: LLMProvider;
  providersStatus: ProviderStatus[];
  onProviderChange: (provider: LLMProvider) => void;
  onModelChange?: (provider: LLMProvider, model: string) => void;
  currentModels?: Partial<Record<LLMProvider, string>>;
  isLoadingProviders?: boolean;
}

export function DashboardHome({ 
  recentProjects, 
  onNewProject, 
  onOpenProject, 
  onImportProject,
  onResetDemo,
  currentProvider,
  providersStatus,
  onProviderChange,
  onModelChange,
  currentModels = {},
  isLoadingProviders = false
}: DashboardHomeProps) {
  const handleGuideClick = () => {
    toast("📚 Guide en développement", {
      description: "La documentation et les tutoriels seront bientôt disponibles !",
      duration: 4000,
    });
  };
  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Business Model Canvas Correcteur</h1>
        <p className="text-gray-600">
          Créez, éditez et analysez vos Business Model Canvas avec l&apos;intelligence artificielle
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onNewProject}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Plus className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-semibold mb-2">Nouveau Projet</h3>
            <p className="text-sm text-gray-600">Créer un nouveau Business Model Canvas</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onImportProject}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Import className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-semibold mb-2">Importer</h3>
            <p className="text-sm text-gray-600">Importer un BMC depuis un fichier</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleGuideClick}>
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-semibold mb-2">Guide</h3>
            <p className="text-sm text-gray-600">Apprendre à utiliser l&apos;outil</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Projets récents</h2>
          <div className="flex gap-2">
            {onResetDemo && (
              <Button variant="outline" size="sm" onClick={onResetDemo}>
                Projets Démo
              </Button>
            )}
            <Button variant="ghost" size="sm">Voir tout</Button>
          </div>
        </div>
        
        {recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <Card 
                key={project.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onOpenProject(project)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      <CardTitle className="text-base truncate">{project.name}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {project.context.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        {project.context.secteur}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {project.context.stade}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">{project.lastModified}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="mb-2">Aucun projet récent</p>
            <p className="text-sm">Commencez par créer votre premier Business Model Canvas</p>
          </Card>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-2xl font-bold">{recentProjects.length}</span>
            </div>
            <p className="text-sm text-gray-600">Projets créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">--</span>
            </div>
            <p className="text-sm text-gray-600">Analyses IA</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-2xl font-bold">--</span>
            </div>
            <p className="text-sm text-gray-600">Cette semaine</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-4 w-4 text-orange-600" />
              <span className="text-2xl font-bold">3</span>
            </div>
            <p className="text-sm text-gray-600">Collaborateurs</p>
          </CardContent>
        </Card>
      </div>

      {/* LLM Provider Configuration */}
      <div className="mt-8">
        <LLMProviderSelector
          currentProvider={currentProvider}
          providersStatus={providersStatus}
          onProviderChange={onProviderChange}
          onModelChange={onModelChange}
          currentModels={currentModels}
          isLoadingProviders={isLoadingProviders}
        />
      </div>
    </div>
  );
}