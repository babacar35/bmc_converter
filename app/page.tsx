'use client';

import { useState, useEffect, useRef } from 'react';
import { ProjectContext, BMCData, AIAnalysis, ProjectData } from '@/types/bmc';
import { LLMManager, LLMProvider, ProviderStatus } from '@/lib/llm';
import { ReactPDFExporter } from '@/lib/pdf-export-react';
import { DashboardHome } from '@/components/dashboard-home';
import { NewProjectDialog } from '@/components/new-project-dialog';
import { ImportDialog } from '@/components/import-dialog';
import { BMCCanvas } from '@/components/bmc-canvas';
import { AIAssistantPanel } from '@/components/ai-assistant-panel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Menu, 
  Settings, 
  Save, 
  Share, 
  FileText, 
  Users, 
  Bot,
  ArrowLeft,
  Plus,
  Edit,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Download,
  Import,
  TrendingUp
} from 'lucide-react';

type ViewMode = 'home' | 'project';

// Utility function to calculate BMC completion progress
const calculateProgress = (bmcData: BMCData): number => {
  const filledSections = Object.values(bmcData).filter(section => section.trim().length > 0).length;
  return Math.round((filledSections / 9) * 100);
};

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('home');
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [bmcData, setBmcData] = useState<BMCData>({
    keyPartners: '',
    keyActivities: '',
    valuePropositions: '',
    customerRelationships: '',
    customerSegments: '',
    keyResources: '',
    channels: '',
    costStructure: '',
    revenueStreams: ''
  });
  const [analyses, setAnalyses] = useState<Record<string, AIAnalysis>>({});
  const [llmManager, setLlmManager] = useState<LLMManager | null>(null);
  const [currentProvider, setCurrentProvider] = useState<LLMProvider>('groq');
  const [providersStatus, setProvidersStatus] = useState<ProviderStatus[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [activeSection, setActiveSection] = useState<keyof BMCData | ''>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');
  const [showProjectMenu, setShowProjectMenu] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [renamingProject, setRenamingProject] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [isExporting, setIsExporting] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [currentModels, setCurrentModels] = useState<Partial<Record<LLMProvider, string>>>({});
  const [menuPosition, setMenuPosition] = useState<{top: number, left: number} | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Projects state with localStorage persistence
  const [recentProjects, setRecentProjects] = useState<ProjectData[]>([
    {
      id: '1',
      name: 'FoodTech - App de Livraison Locale',
      lastModified: '30 minutes ago',
      context: {
        titre: 'FoodTech - App de Livraison Locale',
        description: 'Application mobile pour connecter les producteurs locaux directement aux consommateurs avec livraison rapide en zone urbaine',
        secteur: 'Food & Beverage',
        stade: 'prototype'
      },
      bmcData: {
        keyPartners: 'Producteurs locaux, fermes bio, coopératives agricoles, livreurs indépendants, restaurants partenaires',
        keyActivities: 'Développement application mobile, gestion plateforme marketplace, coordination logistique livraison, marketing digital, relation client',
        valuePropositions: 'Produits frais locaux livrés en 2h, traçabilité complète origine-consommateur, soutien économie locale, prix justes producteurs, réduction empreinte carbone',
        customerRelationships: 'Support client 24/7, programme fidélité, notifications push personnalisées, communauté online, ateliers découverte produits',
        customerSegments: 'Familles urbaines soucieuses alimentation saine, jeunes actifs manque de temps, seniors recherchant qualité, restaurants locavores',
        keyResources: 'Plateforme technologique, algorithmes logistique, base données producteurs, équipe développement, réseau de livreurs',
        channels: 'Application mobile iOS/Android, site web, réseaux sociaux, partenariats magasins bio, bouche-à-oreille',
        costStructure: 'Développement et maintenance app (35%), salaires équipe (30%), marketing acquisition (20%), logistique livraison (15%)',
        revenueStreams: 'Commission 15% sur ventes, frais livraison 3-5€, abonnement premium sans frais livraison 9,90€/mois, publicité producteurs'
      }
    },
    {
      id: '2',
      name: 'EduTech - Plateforme Formations Pro',
      lastModified: '2 hours ago',
      context: {
        titre: 'EduTech - Plateforme Formations Pro',
        description: 'Plateforme de formation professionnelle en ligne avec IA pour personnaliser les parcours d\'apprentissage selon les objectifs carrière',
        secteur: 'Edtech',
        stade: 'lance'
      },
      bmcData: {
        keyPartners: 'Organismes formation, experts métiers, entreprises partenaires, universités, centres compétences',
        keyActivities: 'Création contenu pédagogique, développement IA recommandation, gestion plateforme LMS, certification parcours',
        valuePropositions: 'Formations adaptées profil individuel, certification reconnue entreprises, apprentissage flexible 24/7, suivi progression IA',
        customerRelationships: 'Accompagnement personnalisé tuteur, communauté apprenants, webinaires experts, support technique dédié',
        customerSegments: 'Salariés en reconversion, managers développement équipes, freelances montée compétences, demandeurs emploi',
        keyResources: 'Algorithmes IA personnalisation, bibliothèque contenus premium, équipe pédagogique, plateforme technique scalable',
        channels: '',
        costStructure: '',
        revenueStreams: ''
      }
    },
    {
      id: '3',
      name: 'GreenTech - Solution Économie Eau',
      lastModified: '1 day ago',
      context: {
        titre: 'GreenTech - Solution Économie Eau',
        description: 'Système IoT intelligent pour optimiser la consommation d\'eau dans les bâtiments avec détection fuites et recommandations économies',
        secteur: 'Autre',
        stade: 'idee'
      },
      bmcData: {
        keyPartners: '',
        keyActivities: '',
        valuePropositions: 'Réduction 30% facture eau, détection fuites temps réel, dashboard consommation intelligente, impact environnemental mesurable',
        customerRelationships: '',
        customerSegments: 'Syndics copropriétés, gestionnaires immobiliers, entreprises RSE, collectivités locales, particuliers maisons',
        keyResources: '',
        channels: '',
        costStructure: '',
        revenueStreams: ''
      }
    }
  ]);

  const collaborators = [
    { name: 'Sarah Chen', status: 'Active now', avatar: 'SC' },
    { name: 'Mike Johnson', status: 'Active now', avatar: 'MJ' },
    { name: 'Alex Rivera', status: 'Offline', avatar: 'AR' }
  ];

  // Load projects from localStorage on mount
  useEffect(() => {
    const savedProjects = localStorage.getItem('bmc-projects');
    if (savedProjects) {
      try {
        const projects = JSON.parse(savedProjects);
        if (projects.length > 0) {
          setRecentProjects(projects);
        }
        // Si localStorage est vide, on garde les projets par défaut
      } catch (error) {
        console.error('Failed to load projects from localStorage:', error);
        // En cas d'erreur, on garde les projets par défaut
      }
    }
    // Marquer comme initialisé après le premier chargement
    setIsInitialized(true);
  }, []);

  // Save projects to localStorage whenever they change (but not on initial load)
  useEffect(() => {
    if (isInitialized && recentProjects.length > 0) {
      localStorage.setItem('bmc-projects', JSON.stringify(recentProjects));
    }
  }, [recentProjects, isInitialized]);

  // Initialize LLM Manager with all providers
  useEffect(() => {
    const initializeLLM = async () => {
      try {
        setIsLoadingProviders(true);
        console.log('🚀 Initializing LLM providers...');
        
        // Test direct des variables d'environnement
        console.log('🔍 Environment check:', {
          groqKey: process.env.NEXT_PUBLIC_GROQ_API_KEY ? 'Found' : 'Missing',
          geminiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY ? 'Found' : 'Missing'
        });
        
        const manager = new LLMManager();
        
        console.log('🔄 Initializing real providers with your API keys...');
        const statuses = await manager.initializeAllProviders();
        
        setLlmManager(manager);
        setProvidersStatus(statuses);
        setCurrentProvider(manager.getCurrentProvider());
        
        // Initialiser les modèles par défaut
        const defaultModels: Partial<Record<LLMProvider, string>> = {};
        statuses.forEach(status => {
          if (status.available) {
            const availableModels = manager.getAvailableModels(status.provider);
            if (availableModels.length > 0) {
              defaultModels[status.provider] = availableModels[0];
            }
          }
        });
        setCurrentModels(defaultModels);
        
        console.log('✅ LLM Manager initialized:', statuses);
        console.log('📊 Current provider:', manager.getCurrentProvider());
        console.log('🎯 Default models:', defaultModels);
        console.log('📋 Providers status:', statuses.map(s => `${s.provider}: ${s.available ? '✅' : '❌'} ${s.error || ''}`));
      } catch (error) {
        console.error('❌ Failed to initialize LLM Manager:', error);
      } finally {
        setIsLoadingProviders(false);
      }
    };
    
    initializeLLM();
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProjectMenu(null);
        setMenuPosition(null);
      }
    };

    const handleScroll = () => {
      if (showProjectMenu) {
        setShowProjectMenu(null);
        setMenuPosition(null);
      }
    };

    const handleResize = () => {
      if (showProjectMenu) {
        setShowProjectMenu(null);
        setMenuPosition(null);
      }
    };

    if (showProjectMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showProjectMenu]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      // Ctrl+S ou Cmd+S pour sauvegarder
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (currentProject && viewMode === 'project') {
          handleManualSave();
        }
      }
      
      // Ctrl+E ou Cmd+E pour export rapide
      if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        if (currentProject && viewMode === 'project') {
          handleExportJSON(currentProject);
          toast.info('⌨️ Export rapide', {
            description: 'Utilisé Ctrl+E pour exporter en JSON',
            duration: 2000
          });
        }
      }
    };

    document.addEventListener('keydown', handleKeyboard);
    return () => document.removeEventListener('keydown', handleKeyboard);
  }, [currentProject, viewMode, bmcData]);

  const handleNewProject = () => {
    setShowNewProjectDialog(true);
  };

  // Quick create with templates
  const handleQuickCreate = (template: 'startup' | 'service') => {
    const templates = {
      startup: {
        titre: 'Startup Innovante',
        description: 'Nouvelle startup avec une proposition de valeur disruptive',
        secteur: 'Technologie',
        stade: 'idee'
      },
      service: {
        titre: 'Service B2B',
        description: 'Service professionnel pour entreprises',
        secteur: 'Service B2B',
        stade: 'prototype'
      }
    };

    const context = templates[template] as ProjectContext;
    handleProjectCreate(context);
    
    toast.success(`✨ Template ${template} créé`, {
      description: `Nouveau BMC créé avec le template ${template}`,
      duration: 3000
    });
  };

  const handleProjectCreate = (context: ProjectContext) => {
    const newProject: ProjectData = {
      id: Date.now().toString(),
      name: context.titre,
      lastModified: 'Just now',
      context,
      bmcData: {
        keyPartners: '',
        keyActivities: '',
        valuePropositions: '',
        customerRelationships: '',
        customerSegments: '',
        keyResources: '',
        channels: '',
        costStructure: '',
        revenueStreams: ''
      }
    };

    setRecentProjects(prev => [newProject, ...prev]);
    setCurrentProject(newProject);
    setBmcData(newProject.bmcData);
    setAnalyses({});
    setViewMode('project');
  };

  const handleOpenProject = (project: ProjectData) => {
    setCurrentProject(project);
    setBmcData(project.bmcData);
    setAnalyses({});
    setViewMode('project');
  };

  const handleBackToHome = () => {
    setViewMode('home');
    setCurrentProject(null);
    setShowAIPanel(false);
    setActiveSection('');
  };

  const resetToDefaultProjects = () => {
    if (confirm('Réinitialiser avec les projets de démonstration ? Cela supprimera vos projets actuels.')) {
      localStorage.removeItem('bmc-projects');
      window.location.reload();
    }
  };

  const handleImportProject = () => {
    setShowImportDialog(true);
  };

  const handleImportConfirm = (importedProject: ProjectData) => {
    // Add to projects list
    setRecentProjects(prev => [importedProject, ...prev]);
    
    // Open the imported project
    setCurrentProject(importedProject);
    setBmcData(importedProject.bmcData);
    setAnalyses({});
    setViewMode('project');
  };

  const handleTitleEdit = () => {
    if (currentProject) {
      setTempTitle(currentProject.context.titre);
      setIsEditingTitle(true);
    }
  };

  const handleTitleSave = () => {
    if (currentProject && tempTitle.trim()) {
      const updatedProject = {
        ...currentProject,
        name: tempTitle.trim(),
        context: {
          ...currentProject.context,
          titre: tempTitle.trim()
        }
      };
      setCurrentProject(updatedProject);
      
      // Update in recent projects list
      setRecentProjects(prev => 
        prev.map(p => p.id === currentProject.id ? updatedProject : p)
      );
    }
    setIsEditingTitle(false);
    setTempTitle('');
  };

  const handleTitleCancel = () => {
    setIsEditingTitle(false);
    setTempTitle('');
  };

  const handleDuplicateProject = (project: ProjectData) => {
    const newProject: ProjectData = {
      ...project,
      id: Date.now().toString(),
      name: `${project.name} (Copie)`,
      lastModified: 'Just now',
      context: {
        ...project.context,
        titre: `${project.context.titre} (Copie)`
      }
    };
    setRecentProjects(prev => [newProject, ...prev]);
    setShowProjectMenu(null);
  };

  const handleExportJSON = (project: ProjectData) => {
    const exportData = {
      project: project,
      bmcData: project.bmcData,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_BMC.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowProjectMenu(null);
    
    toast.success('📄 Export JSON réussi', {
      description: `Le fichier ${project.name}_BMC.json a été téléchargé`
    });
  };

  const handleExportPDF = async (project: ProjectData) => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      const exporter = new ReactPDFExporter();
      
      // The simplified exporter handles both canvas and fallback automatically
      await exporter.exportBMCCanvas(project);
      toast.success('📑 Export PDF réussi', {
        description: `Le fichier PDF de ${project.name} a été téléchargé`
      });
    } catch (error) {
      console.error('PDF export error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
      
      toast.error('❌ Erreur d\'export PDF', {
        description: errorMsg.includes('Canvas element not found') ? 
          'Le BMC doit être ouvert et visible pour l\'export' :
          'Une erreur est survenue pendant l\'export'
      });
    } finally {
      setIsExporting(false);
      setShowProjectMenu(null);
    }
  };

  const handleDeleteProject = (project: ProjectData) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`)) {
      setRecentProjects(prev => prev.filter(p => p.id !== project.id));
      if (currentProject?.id === project.id) {
        handleBackToHome();
      }
      setShowProjectMenu(null);
    }
  };

  const handleRenameProject = (project: ProjectData, newName: string) => {
    const updatedProject = {
      ...project,
      name: newName,
      context: {
        ...project.context,
        titre: newName
      }
    };
    
    setRecentProjects(prev => 
      prev.map(p => p.id === project.id ? updatedProject : p)
    );
    
    if (currentProject?.id === project.id) {
      setCurrentProject(updatedProject);
    }
    
    setShowProjectMenu(null);
  };

  const handleSectionChange = (sectionId: keyof BMCData, content: string) => {
    setSaveStatus('saving');
    
    setBmcData(prev => ({
      ...prev,
      [sectionId]: content
    }));
    
    // Update current project
    if (currentProject) {
      const updatedProject = {
        ...currentProject,
        bmcData: {
          ...currentProject.bmcData,
          [sectionId]: content
        },
        lastModified: 'Just now'
      };
      
      setCurrentProject(updatedProject);
      
      // Update in projects list and trigger localStorage save
      setRecentProjects(prev => 
        prev.map(p => p.id === currentProject.id ? updatedProject : p)
      );
      
      // Simulate save completion after brief delay
      setTimeout(() => {
        setSaveStatus('saved');
      }, 800);
    }
    
    // Remove old analysis when content changes
    if (analyses[sectionId]) {
      const newAnalyses = { ...analyses };
      delete newAnalyses[sectionId];
      setAnalyses(newAnalyses);
    }
  };

  const handleAnalyzeSection = async (sectionId: keyof BMCData) => {
    if (!llmManager || !currentProject) return;

    setIsAnalyzing(true);
    setActiveSection(sectionId);
    setShowAIPanel(true);

    try {
      console.log(`🤖 Analyzing section ${sectionId} with provider: ${currentProvider}`);
      
      const analysis = await llmManager.analyzeSection(
        sectionId,
        bmcData[sectionId],
        currentProject.context,
        bmcData,
        {
          preferredProvider: currentProvider,
          enableFallback: true
        }
      );
      
      setAnalyses(prev => ({
        ...prev,
        [sectionId]: analysis
      }));
      
      console.log(`✅ Analysis completed for ${sectionId}`);
    } catch (error) {
      console.error('❌ Analysis error:', error);
      // En cas d'erreur, on ne garde pas d'analyse corrompue
      setAnalyses(prev => {
        const newAnalyses = { ...prev };
        delete newAnalyses[sectionId];
        return newAnalyses;
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle provider changes
  const handleProviderChange = (provider: LLMProvider) => {
    if (!llmManager) return;
    
    const success = llmManager.switchProvider(provider);
    if (success) {
      setCurrentProvider(provider);
      console.log(`🔄 Switched to provider: ${provider}`);
    }
  };

  const handleModelChange = (provider: LLMProvider, model: string) => {
    if (!llmManager) return;
    
    console.log(`📝 Model change requested: ${provider} -> ${model}`);
    
    // Mettre à jour le state local
    setCurrentModels(prev => ({
      ...prev,
      [provider]: model
    }));
    
    // Pour Ollama, reconfigurer le provider avec le nouveau modèle
    if (provider === 'ollama') {
      const updateModel = async () => {
        const success = await llmManager.updateProviderModel(provider, model);
        
        if (success) {
          console.log(`✅ Ollama model updated to: ${model}`);
        } else {
          console.warn(`⚠️ Failed to update Ollama model to: ${model}`);
        }
      };
      
      updateModel();
    }
  };

  // Manual save function
  const handleManualSave = () => {
    if (!currentProject) return;
    
    setSaveStatus('saving');
    
    // Force save to localStorage
    const updatedProject = {
      ...currentProject,
      bmcData,
      lastModified: new Date().toLocaleString('fr-FR')
    };
    
    setCurrentProject(updatedProject);
    setRecentProjects(prev => 
      prev.map(p => p.id === currentProject.id ? updatedProject : p)
    );
    
    // Show completion
    setTimeout(() => {
      setSaveStatus('saved');
      toast.success('💾 Projet sauvegardé', {
        description: 'Vos modifications ont été sauvegardées avec succès'
      });
    }, 500);
  };

  // Handle section click from AI panel - réouvre l'analyse existante
  const handleSectionClick = (sectionId: string) => {
    // Cette fonction va changer la section active dans le panel AI
    // Le panel reste ouvert pour une meilleure expérience utilisateur
    setActiveSection(sectionId as keyof BMCData);
    
    // Le panel AI reste ouvert et affiche maintenant l'analyse de la section sélectionnée
    // Cela permet à l'utilisateur de naviguer facilement entre les différentes analyses
  };

  // Show home dashboard by default
  if (viewMode === 'home') {
    return (
      <>
        <DashboardHome
          recentProjects={recentProjects}
          onNewProject={handleNewProject}
          onOpenProject={handleOpenProject}
          onImportProject={handleImportProject}
          onResetDemo={resetToDefaultProjects}
          currentProvider={currentProvider}
          providersStatus={providersStatus}
          onProviderChange={handleProviderChange}
          onModelChange={handleModelChange}
          currentModels={currentModels}
          isLoadingProviders={isLoadingProviders}
        />
        <NewProjectDialog
          isOpen={showNewProjectDialog}
          onClose={() => setShowNewProjectDialog(false)}
          onProjectCreate={handleProjectCreate}
        />
        <ImportDialog
          isOpen={showImportDialog}
          onClose={() => setShowImportDialog(false)}
          onImport={handleImportConfirm}
        />
      </>
    );
  }

  // Show error if no LLM manager
  if (!llmManager) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
          <div className="flex items-center gap-2 mb-4">
            <Bot className="h-6 w-6 text-red-600" />
            <h2 className="text-lg font-semibold">Erreur Configuration</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Aucun provider LLM n&apos;est configuré. Veuillez ajouter au moins une clé API dans le fichier .env.local :
          </p>
          <code className="block bg-gray-100 p-2 rounded text-sm mb-4">
            NEXT_PUBLIC_GROQ_API_KEY=your_groq_key<br/>
            NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_key<br/>
            # ou utilisez Ollama localement
          </code>
          <Button onClick={handleBackToHome} className="w-full">
            Retour à l&apos;accueil
          </Button>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="mb-4">Aucun projet sélectionné</p>
          <Button onClick={handleBackToHome}>Retour à l&apos;accueil</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Mobile Overlay */}
      {!isSidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        ${isSidebarCollapsed ? 'w-16' : 'w-64'} 
        ${!isSidebarCollapsed ? 'md:relative fixed inset-y-0 left-0 z-50 md:z-auto' : 'relative'}
        bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out
        transform ${!isSidebarCollapsed ? 'translate-x-0' : 'md:translate-x-0 -translate-x-full md:-translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">BMC</span>
                </div>
                <div className="flex-1 min-w-0">
                  {isEditingTitle ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={tempTitle}
                        onChange={(e) => setTempTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleTitleSave();
                          if (e.key === 'Escape') handleTitleCancel();
                        }}
                        onBlur={handleTitleSave}
                        autoFocus
                        className="flex-1 text-sm font-semibold bg-transparent border-0 border-b border-blue-400 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <span 
                      className="font-semibold text-sm truncate cursor-pointer hover:text-blue-600 block"
                      onClick={handleTitleEdit}
                      title="Cliquer pour renommer"
                    >
                      {currentProject?.context.titre || 'Untitled Business Model'}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* Mobile close button */}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 md:hidden"
                  onClick={() => setIsSidebarCollapsed(true)}
                  title="Fermer sidebar"
                >
                  <X className="h-4 w-4" />
                </Button>
                
                {/* Desktop collapse button */}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 p-0 hidden md:flex hover:bg-gray-100"
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  title="Réduire sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Collapsed Header Layout */
            <div className="flex flex-col items-center space-y-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">BMC</span>
              </div>
              
              {/* Desktop expand button - positioned below logo */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 hidden md:flex hover:bg-gray-100 border border-gray-300"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                title="Agrandir sidebar"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              
              {/* Mobile close button for collapsed state */}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 md:hidden border border-gray-300"
                onClick={() => setIsSidebarCollapsed(true)}
                title="Fermer sidebar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {!isSidebarCollapsed && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                className={`flex-1 ${saveStatus === 'saved' ? 'bg-green-600 hover:bg-green-700' : saveStatus === 'saving' ? 'bg-blue-600' : ''}`}
                disabled={saveStatus === 'saving'}
                onClick={handleManualSave}
                title="Sauvegarder (Ctrl+S)"
              >
                {saveStatus === 'saving' ? (
                  <Clock className="h-3 w-3 mr-1 animate-pulse" />
                ) : saveStatus === 'saved' ? (
                  <Check className="h-3 w-3 mr-1" />
                ) : (
                  <Save className="h-3 w-3 mr-1" />
                )}
                <span>
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Save'}
                </span>
              </Button>
              {/* Export Dropdown Menu */}
              <div className="relative" ref={showProjectMenu === 'export' ? menuRef : undefined}>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowProjectMenu(showProjectMenu === 'export' ? null : 'export');
                  }}
                  disabled={isExporting || !currentProject}
                  title="Options d'export"
                >
                  {isExporting ? (
                    <Clock className="h-3 w-3 animate-pulse" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                </Button>
                
                {showProjectMenu === 'export' && currentProject && (
                  <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px] max-w-[200px]">
                    <button
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportJSON(currentProject);
                        setShowProjectMenu(null);
                      }}
                    >
                      <FileText className="h-3 w-3" />
                      Export JSON
                    </button>
                    <button
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportPDF(currentProject);
                        setShowProjectMenu(null);
                      }}
                      disabled={isExporting}
                    >
                      <Download className="h-3 w-3" />
                      {isExporting ? 'Export en cours...' : 'Export PDF'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Canvas Progress */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">CANVAS PROGRESS</span>
              <div className="text-sm text-gray-500">{calculateProgress(bmcData)}%</div>
            </div>
            <div className="text-xs text-gray-500 mb-2">
              {Object.values(bmcData).filter(section => section.trim().length > 0).length}/9 sections remplies
            </div>
            <div className="text-xs text-gray-500">
              {Object.values(analyses).length} analyses IA
            </div>
          </div>
        )}
        
        {/* Collapsed Progress Indicator */}
        {isSidebarCollapsed && (
          <div className="p-2 border-b border-gray-200">
            <div className="w-8 h-1 bg-gray-200 rounded-full mx-auto" title={`${calculateProgress(bmcData)}% complété`}>
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress(bmcData)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Recent Projects */}
        <div className="p-4 border-b border-gray-200 flex-1 overflow-hidden relative">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">RECENT PROJECTS</span>
                <div className="relative" ref={showProjectMenu === 'new' ? menuRef : undefined}>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowProjectMenu(showProjectMenu === 'new' ? null : 'new');
                    }}
                    title="Créer un nouveau projet"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  {showProjectMenu === 'new' && (
                    <div className="absolute right-0 top-8 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px] max-w-[180px]">
                      <button
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNewProject();
                          setShowProjectMenu(null);
                        }}
                      >
                        <Plus className="h-3 w-3" />
                        Nouveau BMC
                      </button>
                      <button
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImportProject();
                          setShowProjectMenu(null);
                        }}
                      >
                        <Import className="h-3 w-3" />
                        Importer BMC
                      </button>
                      <button
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickCreate('startup');
                          setShowProjectMenu(null);
                        }}
                      >
                        <TrendingUp className="h-3 w-3" />
                        Template Startup
                      </button>
                      <button
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickCreate('service');
                          setShowProjectMenu(null);
                        }}
                      >
                        <Users className="h-3 w-3" />
                        Template Service
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center mb-3">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-8 w-8 p-0 mb-2"
                onClick={handleNewProject}
                title="Nouveau projet"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="space-y-2 overflow-y-auto overflow-x-hidden flex-1">
            {recentProjects.slice(0, 4).map((project, index) => {
              const isCurrentProject = currentProject?.id === project.id;
              return (
                <div 
                  key={index} 
                  className={`group flex items-center gap-2 p-2 rounded transition-all duration-200 ${
                    isCurrentProject 
                      ? 'bg-blue-50 border-l-3 border-blue-500 shadow-sm' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {!isSidebarCollapsed ? (
                    <>
                      <div className="relative">
                        <FileText className={`h-4 w-4 transition-colors duration-200 ${
                          isCurrentProject ? 'text-blue-600' : 'text-gray-500'
                        }`} />
                        {isCurrentProject && (
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => handleOpenProject(project)}
                      >
                      {renamingProject === project.id ? (
                        <div className="flex gap-1">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleRenameProject(project, renameValue);
                                setRenamingProject(null);
                              }
                              if (e.key === 'Escape') {
                                setRenamingProject(null);
                                setRenameValue('');
                              }
                            }}
                            onBlur={() => {
                              if (renameValue.trim()) {
                                handleRenameProject(project, renameValue);
                              }
                              setRenamingProject(null);
                            }}
                            autoFocus
                            className="flex-1 text-sm font-medium bg-transparent border-0 border-b border-blue-400 focus:outline-none"
                          />
                        </div>
                      ) : (
                        <>
                          <div className={`text-sm font-medium truncate transition-colors duration-200 ${
                            isCurrentProject ? 'text-blue-900' : 'text-gray-900'
                          }`}>
                            {project.name}
                            {isCurrentProject && (
                              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                ACTUEL
                              </span>
                            )}
                          </div>
                          <div className={`text-xs transition-colors duration-200 ${
                            isCurrentProject ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {project.lastModified}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="relative" ref={showProjectMenu === project.id ? menuRef : undefined}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        data-project-menu={project.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (showProjectMenu === project.id) {
                            setShowProjectMenu(null);
                            setMenuPosition(null);
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const popupWidth = 192; // w-48 = 12rem = 192px
                            const popupHeight = 300; // estimation de la hauteur du popup
                            
                            let left = rect.right + 8;
                            let top = rect.top;
                            
                            // S'assurer que le popup ne sort pas de l'écran à droite
                            if (left + popupWidth > window.innerWidth) {
                              left = rect.left - popupWidth - 8;
                            }
                            
                            // S'assurer que le popup ne sort pas de l'écran en bas
                            if (top + popupHeight > window.innerHeight) {
                              top = window.innerHeight - popupHeight - 8;
                            }
                            
                            // S'assurer que le popup ne sort pas de l'écran en haut
                            if (top < 8) {
                              top = 8;
                            }
                            
                            setMenuPosition({ top, left });
                            setShowProjectMenu(project.id);
                          }
                        }}
                        title="Options du projet"
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                      
                      {showProjectMenu === project.id && (
                        <div className="fixed z-50 w-48 bg-white border border-gray-200/60 rounded-xl shadow-2xl py-2 animate-in fade-in-0 zoom-in-95 duration-100 backdrop-blur-sm" 
                             style={{
                               top: `${menuPosition?.top || 0}px`,
                               left: `${menuPosition?.left || 0}px`
                             }}>
                          <button
                            className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50/80 flex items-center gap-3 transition-all duration-150 border-none bg-transparent text-gray-700 hover:text-gray-900 group"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenameValue(project.name);
                              setRenamingProject(project.id);
                              setShowProjectMenu(null);
                            }}
                          >
                            <Edit className="h-4 w-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                            <span className="font-medium">Renommer</span>
                          </button>
                          <button
                            className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50/80 flex items-center gap-3 transition-all duration-150 border-none bg-transparent text-gray-700 hover:text-gray-900 group"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateProject(project);
                            }}
                          >
                            <FileText className="h-4 w-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                            <span className="font-medium">Dupliquer</span>
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50/80 flex items-center gap-3 transition-all duration-150 border-none bg-transparent text-gray-700 hover:text-gray-900 group"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportJSON(project);
                            }}
                          >
                            <FileText className="h-4 w-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                            <span className="font-medium">Export JSON</span>
                          </button>
                          <button
                            className="w-full px-4 py-3 text-left text-sm hover:bg-gray-50/80 flex items-center gap-3 transition-all duration-150 border-none bg-transparent text-gray-700 hover:text-gray-900 group"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportPDF(project);
                            }}
                            disabled={isExporting}
                          >
                            <Download className="h-4 w-4 text-gray-500 group-hover:text-gray-700 transition-colors" />
                            <span className="font-medium">
                              {isExporting ? 'Export en cours...' : 'Export PDF'}
                            </span>
                          </button>
                          <div className="border-t border-gray-100 my-1"></div>
                          <button
                            className="w-full px-4 py-3 text-left text-sm hover:bg-red-50/80 flex items-center gap-3 transition-all duration-150 border-none bg-transparent text-red-600 hover:text-red-700 group"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProject(project);
                            }}
                          >
                            <X className="h-4 w-4 text-red-500 group-hover:text-red-700 transition-colors" />
                            <span className="font-medium">Supprimer</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div 
                    className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center cursor-pointer hover:bg-blue-200"
                    onClick={() => handleOpenProject(project)}
                    title={project.name}
                  >
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>

        {/* AI Assistant */}
        <div className="p-4 border-b border-gray-200">
          {!isSidebarCollapsed ? (
            <Button
              variant={showAIPanel ? "default" : "ghost"}
              className="w-full justify-start"
              size="sm"
              onClick={() => setShowAIPanel(!showAIPanel)}
            >
              <Bot className="h-4 w-4 mr-2" />
              AI Assistant
            </Button>
          ) : (
            <Button
              variant={showAIPanel ? "default" : "ghost"}
              className="h-8 w-8 p-0 mx-auto block"
              size="sm"
              onClick={() => setShowAIPanel(!showAIPanel)}
              title="AI Assistant"
            >
              <Bot className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Collaborators */}
        <div className="p-4 border-b border-gray-200">
          {!isSidebarCollapsed ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium">COLLABORATORS</span>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-6 w-6 p-0"
                  title="Inviter des collaborateurs"
                >
                  <Users className="h-3 w-3" />
                </Button>
              </div>
              <div className="space-y-2">
                {collaborators.map((collab, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                      {collab.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{collab.name}</div>
                      <div className={`text-xs ${collab.status === 'Active now' ? 'text-green-600' : 'text-gray-500'}`}>
                        {collab.status === 'Active now' ? '● Active now' : '○ Offline'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center space-y-1">
              {collaborators.slice(0, 3).map((collab, index) => (
                <div 
                  key={index} 
                  className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs"
                  title={`${collab.name} - ${collab.status}`}
                >
                  {collab.avatar.charAt(0)}
                </div>
              ))}
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0 mt-1"
                title="Inviter des collaborateurs"
              >
                <Users className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="p-4">
          {!isSidebarCollapsed ? (
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          ) : (
            <Button variant="ghost" className="h-8 w-8 p-0 mx-auto block" size="sm" title="Settings">
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile burger menu button */}
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden"
                onClick={() => setIsSidebarCollapsed(false)}
                title="Ouvrir menu"
              >
                <Menu className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleBackToHome}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Retour</span>
              </Button>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl font-bold truncate">Business Model Canvas</h1>
                <p className="text-xs md:text-sm text-gray-600 hidden sm:block">Click on any section to start editing. AI suggestions will appear automatically.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Save Status Indicator */}
              <div className="flex items-center gap-1 text-xs text-gray-500 hidden sm:flex">
                {saveStatus === 'saving' ? (
                  <>
                    <Clock className="h-3 w-3 animate-pulse text-blue-500" />
                    <span className="text-blue-500">Saving...</span>
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">Saved</span>
                  </>
                ) : null}
              </div>
              
              <span className="text-sm text-blue-600 hidden md:inline">Progress</span>
              <Badge variant="outline" className="text-xs">{calculateProgress(bmcData)}%</Badge>
            </div>
          </div>
        </div>

        {/* Canvas Container */}
        <div className="flex-1 flex">
          <div className="flex-1 overflow-auto">
            <BMCCanvas
              bmcData={bmcData}
              onSectionChange={handleSectionChange}
              onAnalyzeSection={handleAnalyzeSection}
              analyses={analyses}
              context={currentProject.context}
              isAnalyzing={isAnalyzing}
              activeSection={activeSection}
              currentProvider={currentProvider}
              onSectionClick={handleSectionClick}
            />
          </div>

          {/* AI Assistant Panel */}
          {showAIPanel && (
            <AIAssistantPanel
              analyses={analyses}
              activeSection={activeSection}
              isVisible={showAIPanel}
              onClose={() => setShowAIPanel(false)}
              onSectionClick={handleSectionClick}
            />
          )}
        </div>
      </div>
    </div>
  );
}