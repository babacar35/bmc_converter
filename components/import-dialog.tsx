'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ProjectData, BMCData } from '@/types/bmc';
import {
  Upload,
  FileJson,
  FileText,
  FilePlus,
  Link as LinkIcon,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Download
} from 'lucide-react';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (project: ProjectData) => void;
}

interface ImportedProject {
  valid: boolean;
  project?: ProjectData;
  errors: string[];
  warnings: string[];
  completeness: number;
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

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [dragActive, setDragActive] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importedData, setImportedData] = useState<ImportedProject | null>(null);
  const [activeTab, setActiveTab] = useState('file');
  const [urlInput, setUrlInput] = useState('');
  const [urlLoading, setUrlLoading] = useState(false);

  // Drag & Drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileImport(files[0]);
    }
  }, []);

  // File validation and parsing
  const validateAndParseFile = async (file: File): Promise<ImportedProject> => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    try {
      let parsedData: any;
      
      if (fileExtension === 'json') {
        const text = await file.text();
        parsedData = JSON.parse(text);
      } else if (fileExtension === 'csv') {
        const text = await file.text();
        parsedData = parseCSV(text);
      } else {
        throw new Error(`Format de fichier non supporté: .${fileExtension}`);
      }

      // Validation et normalisation
      return validateProjectData(parsedData);
    } catch (error) {
      return {
        valid: false,
        errors: [error instanceof Error ? error.message : 'Erreur inconnue'],
        warnings: [],
        completeness: 0
      };
    }
  };

  const parseCSV = (csvText: string): any => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('Fichier CSV invalide : doit contenir au moins un en-tête et une ligne de données');
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const values = lines[1].split(',').map(v => v.trim().replace(/"/g, ''));

    // Mapping CSV vers BMC
    const bmcData: Partial<BMCData> = {};
    const context = {
      titre: 'Projet importé CSV',
      description: 'Importé depuis un fichier CSV',
      secteur: 'Non spécifié',
      stade: 'prototype' as const
    };

    // Mapping automatique avec multiple variantes linguistiques
    headers.forEach((header, index) => {
      const value = values[index] || '';
      const lowerHeader = header.toLowerCase().trim();

      // Nettoyage du header
      const cleanHeader = lowerHeader
        .replace(/[\s_-]+/g, ' ')
        .replace(/[()]/g, '');

      // Mapping avec patterns multiples
      if (cleanHeader.match(/partenaire|partner|key partner/)) {
        bmcData.keyPartners = value;
      } else if (cleanHeader.match(/activité|activity|key activit|activités clés/)) {
        bmcData.keyActivities = value;
      } else if (cleanHeader.match(/proposition.*valeur|value.*proposition|valeur/)) {
        bmcData.valuePropositions = value;
      } else if (cleanHeader.match(/relation.*client|customer.*relation|relation/)) {
        bmcData.customerRelationships = value;
      } else if (cleanHeader.match(/segment.*client|customer.*segment|segment/)) {
        bmcData.customerSegments = value;
      } else if (cleanHeader.match(/ressource|resource|key resource/)) {
        bmcData.keyResources = value;
      } else if (cleanHeader.match(/canal|channel|canaux/)) {
        bmcData.channels = value;
      } else if (cleanHeader.match(/coût|cost.*structure|structure.*coût|coûts/)) {
        bmcData.costStructure = value;
      } else if (cleanHeader.match(/revenu|revenue.*stream|flux.*revenu/)) {
        bmcData.revenueStreams = value;
      } else if (cleanHeader.match(/titre|title|nom|name|projet|project/) && !context.titre) {
        context.titre = value || `BMC CSV ${new Date().toLocaleDateString()}`;
      } else if (cleanHeader.match(/description|desc|resume|résumé/) && !context.description) {
        context.description = value || 'BMC importé depuis un fichier CSV';
      } else if (cleanHeader.match(/secteur|sector|industrie|industry/) && !context.secteur) {
        context.secteur = value || 'Non spécifié';
      } else if (cleanHeader.match(/stade|stage|phase/) && !context.stade) {
        context.stade = value || 'prototype';
      }
    });

    // Fallbacks pour métadonnées manquantes
    if (!context.titre) {
      context.titre = `BMC CSV ${new Date().toLocaleDateString()}`;
    }
    if (!context.description) {
      context.description = 'Business Model Canvas importé depuis un fichier CSV';
    }

    return {
      project: {
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
          revenueStreams: '',
          ...bmcData
        }
      }
    };
  };

  const validateProjectData = (data: any): ImportedProject => {
    const errors: string[] = [];
    const warnings: string[] = [];
    let completeness = 0;

    // Auto-correction de la structure si possible
    if (!data.project) {
      // Si pas de structure project, essayer de deviner si c'est un BMC direct
      if (data.keyPartners || data.valuePropositions || Object.keys(data).some(key => key in sectionNames)) {
        console.log('🔧 Structure BMC détectée, création automatique du wrapper project');
        data = {
          project: {
            context: {
              titre: data.titre || data.name || 'BMC Importé',
              description: data.description || 'Importé automatiquement',
              secteur: data.secteur || data.sector || 'Non spécifié',
              stade: data.stade || data.stage || 'prototype'
            },
            bmcData: data
          }
        };
      } else {
        errors.push('Structure invalide : impossible de détecter un format BMC valide');
        return { valid: false, errors, warnings, completeness: 0 };
      }
    }

    // Validation du contexte avec auto-création
    if (!data.project.context) {
      warnings.push('Contexte manquant, création automatique des métadonnées');
      data.project.context = {
        titre: 'BMC Importé',
        description: 'Importé sans métadonnées',
        secteur: 'Non spécifié',
        stade: 'prototype'
      };
    } else {
      if (!data.project.context.titre) {
        warnings.push('Titre manquant, titre par défaut appliqué');
        data.project.context.titre = `BMC Importé ${new Date().toLocaleDateString()}`;
      }
      if (!data.project.context.description) {
        warnings.push('Description manquante, description par défaut appliquée');
        data.project.context.description = 'Business Model Canvas importé sans description';
      }
      if (!data.project.context.secteur) {
        warnings.push('Secteur non spécifié, valeur par défaut appliquée');
        data.project.context.secteur = 'Non spécifié';
      }
    }

    if (!data.project.bmcData) {
      errors.push('Données BMC manquantes');
      return { valid: false, errors, warnings, completeness: 0 };
    }

    // Calcul de la complétude
    const bmcSections = Object.keys(sectionNames);
    const filledSections = bmcSections.filter(
      section => data.project.bmcData[section] && data.project.bmcData[section].trim().length > 0
    );
    completeness = Math.round((filledSections.length / bmcSections.length) * 100);

    if (completeness < 30) {
      warnings.push('BMC peu rempli (moins de 30% des sections)');
    }

    // Normalisation
    const normalizedProject: ProjectData = {
      id: Date.now().toString(),
      name: data.project.context?.titre || data.project.name || 'Projet importé',
      lastModified: 'Just imported',
      context: {
        titre: data.project.context?.titre || 'Projet importé',
        description: data.project.context?.description || 'Importé depuis un fichier externe',
        secteur: data.project.context?.secteur || 'Non spécifié',
        stade: data.project.context?.stade || 'prototype'
      },
      bmcData: {
        keyPartners: data.project.bmcData.keyPartners || '',
        keyActivities: data.project.bmcData.keyActivities || '',
        valuePropositions: data.project.bmcData.valuePropositions || '',
        customerRelationships: data.project.bmcData.customerRelationships || '',
        customerSegments: data.project.bmcData.customerSegments || '',
        keyResources: data.project.bmcData.keyResources || '',
        channels: data.project.bmcData.channels || '',
        costStructure: data.project.bmcData.costStructure || '',
        revenueStreams: data.project.bmcData.revenueStreams || ''
      }
    };

    return {
      valid: errors.length === 0,
      project: normalizedProject,
      errors,
      warnings,
      completeness
    };
  };

  const handleFileImport = async (file: File) => {
    setImporting(true);
    setImportProgress(0);

    try {
      // Simulation du progress
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 20, 90));
      }, 200);

      const result = await validateAndParseFile(file);
      
      clearInterval(progressInterval);
      setImportProgress(100);
      setImportedData(result);
      
      setTimeout(() => {
        setImporting(false);
        setImportProgress(0);
      }, 500);
    } catch (error) {
      setImporting(false);
      setImportProgress(0);
      setImportedData({
        valid: false,
        errors: ['Erreur lors du traitement du fichier'],
        warnings: [],
        completeness: 0
      });
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileImport(file);
    }
  };

  const handleImportConfirm = () => {
    if (importedData?.valid && importedData.project) {
      onImport(importedData.project);
      toast.success("🎉 Import réussi !", {
        description: `Le projet "${importedData.project.name}" a été importé avec succès.`,
        duration: 3000,
      });
      resetState();
      onClose();
    }
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) return;

    setUrlLoading(true);
    setImportProgress(0);

    try {
      // Validation de l'URL
      const url = new URL(urlInput.trim());
      
      // Progression simulée
      const progressInterval = setInterval(() => {
        setImportProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      // Tentative de récupération du contenu
      const response = await fetch(url.toString());
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';
      let data;

      if (contentType.includes('application/json')) {
        data = await response.json();
      } else if (contentType.includes('text/csv')) {
        const text = await response.text();
        data = parseCSV(text);
      } else if (contentType.includes('text/plain')) {
        const text = await response.text();
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error('Le contenu texte n\'est pas un JSON valide');
        }
      } else {
        throw new Error(`Type de contenu non supporté: ${contentType}`);
      }

      clearInterval(progressInterval);
      setImportProgress(100);

      const result = validateProjectData(data);
      setImportedData(result);

      setTimeout(() => {
        setUrlLoading(false);
        setImportProgress(0);
      }, 500);

    } catch (error) {
      setUrlLoading(false);
      setImportProgress(0);
      setImportedData({
        valid: false,
        errors: [
          error instanceof Error ? error.message : 'Erreur lors de l\'import par URL',
          'Vérifiez que l\'URL est accessible et contient un format supporté'
        ],
        warnings: [],
        completeness: 0
      });
    }
  };

  const resetState = () => {
    setImportedData(null);
    setImporting(false);
    setImportProgress(0);
    setUrlInput('');
    setUrlLoading(false);
    setActiveTab('file');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importer un Business Model Canvas
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="file" className="flex items-center gap-2">
              <FileJson className="h-4 w-4" />
              Fichier
            </TabsTrigger>
            <TabsTrigger value="url" className="flex items-center gap-2">
              <LinkIcon className="h-4 w-4" />
              URL
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Modèles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="file" className="space-y-4">
            {importing && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Traitement du fichier...</span>
                      <span className="text-sm text-gray-500">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                </CardContent>
              </Card>
            )}

            {!importedData && !importing && (
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Glissez-déposez vos fichiers ici
                </h3>
                <p className="text-gray-600 mb-4">
                  ou cliquez pour sélectionner un fichier
                </p>
                
                <input
                  type="file"
                  accept=".json,.csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-input"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-input" className="cursor-pointer">
                    <FilePlus className="h-4 w-4 mr-2" />
                    Choisir un fichier
                  </label>
                </Button>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <FileJson className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                      <h4 className="font-medium">JSON</h4>
                      <p className="text-sm text-gray-600">Format d'export natif</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <FileText className="h-8 w-8 mx-auto text-green-600 mb-2" />
                      <h4 className="font-medium">CSV</h4>
                      <p className="text-sm text-gray-600">Excel, Google Sheets</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {importedData && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {importedData.valid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        Validation du fichier
                      </span>
                      <Badge variant={importedData.valid ? "default" : "destructive"}>
                        {importedData.valid ? "Valide" : "Erreurs"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Complétude du BMC : {importedData.completeness}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={importedData.completeness} className="mb-4" />
                    
                    {importedData.errors.length > 0 && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc pl-4">
                            {importedData.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {importedData.warnings.length > 0 && (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc pl-4">
                            {importedData.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {importedData.valid && importedData.project && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Eye className="h-5 w-5" />
                        Aperçu du projet
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium">Informations générales</h4>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <span className="text-sm text-gray-600">Titre :</span>
                              <p className="font-medium">{importedData.project.context.titre}</p>
                            </div>
                            <div>
                              <span className="text-sm text-gray-600">Secteur :</span>
                              <p className="font-medium">{importedData.project.context.secteur}</p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="font-medium mb-3">Sections BMC</h4>
                          <div className="grid grid-cols-2 gap-2">
                            {Object.entries(sectionNames).map(([key, name]) => {
                              const content = importedData.project!.bmcData[key as keyof BMCData];
                              const filled = content && content.trim().length > 0;
                              return (
                                <div key={key} className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${filled ? 'bg-green-500' : 'bg-gray-300'}`} />
                                  <span className="text-sm">{name}</span>
                                  {filled && <Badge variant="outline" className="text-xs">Remplie</Badge>}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetState}>
                    <X className="h-4 w-4 mr-2" />
                    Annuler
                  </Button>
                  {importedData.valid && (
                    <Button onClick={handleImportConfirm}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Importer ce projet
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="url" className="space-y-4">
            {urlLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Téléchargement depuis l'URL...</span>
                      <span className="text-sm text-gray-500">{importProgress}%</span>
                    </div>
                    <Progress value={importProgress} />
                  </div>
                </CardContent>
              </Card>
            )}

            {!importedData && !urlLoading && (
              <Card>
                <CardHeader>
                  <CardTitle>Import depuis une URL</CardTitle>
                  <CardDescription>
                    Importez un BMC depuis une URL publique (JSON ou CSV)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url-input">URL du fichier</Label>
                    <Input
                      id="url-input"
                      type="url"
                      placeholder="https://example.com/mon-bmc.json"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleUrlImport();
                        }
                      }}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">URLs supportées :</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• Fichiers JSON hébergés publiquement</li>
                      <li>• Fichiers CSV depuis Google Sheets (export public)</li>
                      <li>• APIs retournant du JSON au bon format</li>
                      <li>• Gists GitHub avec des données BMC</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="font-medium text-yellow-900 mb-2">⚠️ Limitations CORS :</h4>
                    <p className="text-sm text-yellow-800">
                      Certains sites bloquent les requêtes cross-origin. Si l'import échoue, 
                      téléchargez le fichier manuellement et utilisez l'import par fichier.
                    </p>
                  </div>

                  <Button 
                    onClick={handleUrlImport}
                    disabled={!urlInput.trim() || urlLoading}
                    className="w-full"
                  >
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Importer depuis l'URL
                  </Button>
                </CardContent>
              </Card>
            )}

            {importedData && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {importedData.valid ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-600" />
                        )}
                        Import depuis URL
                      </span>
                      <Badge variant={importedData.valid ? "default" : "destructive"}>
                        {importedData.valid ? "Valide" : "Erreurs"}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Source : {urlInput}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Progress value={importedData.completeness} className="mb-4" />
                    
                    {importedData.errors.length > 0 && (
                      <Alert variant="destructive" className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc pl-4">
                            {importedData.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}

                    {importedData.warnings.length > 0 && (
                      <Alert className="mb-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <ul className="list-disc pl-4">
                            {importedData.warnings.map((warning, index) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={resetState}>
                    <X className="h-4 w-4 mr-2" />
                    Réessayer
                  </Button>
                  {importedData.valid && (
                    <Button onClick={handleImportConfirm}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Importer ce projet
                    </Button>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="template" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Modèle CSV
                  </CardTitle>
                  <CardDescription>
                    Téléchargez un modèle CSV pour créer votre BMC dans Excel ou Google Sheets
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Format du fichier CSV :</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Première ligne : En-têtes des colonnes</li>
                        <li>• Deuxième ligne : Vos données BMC</li>
                        <li>• Colonnes obligatoires : Titre, Partenaires Clés, Activités Clés, etc.</li>
                        <li>• Utilisez des guillemets pour les textes contenant des virgules</li>
                      </ul>
                    </div>
                    
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/template-bmc.csv';
                        link.download = 'modele-bmc.csv';
                        link.click();
                      }}
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le modèle CSV
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileJson className="h-5 w-5" />
                    Format JSON
                  </CardTitle>
                  <CardDescription>
                    Structure JSON pour l'import programmatique
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
                    <pre>{JSON.stringify({
                      project: {
                        context: {
                          titre: "Mon Projet",
                          description: "Description du projet",
                          secteur: "Tech",
                          stade: "prototype"
                        },
                        bmcData: {
                          keyPartners: "Partenaires clés...",
                          keyActivities: "Activités clés...",
                          valuePropositions: "Propositions de valeur...",
                          customerRelationships: "Relations clients...",
                          customerSegments: "Segments de clientèle...",
                          keyResources: "Ressources clés...",
                          channels: "Canaux...",
                          costStructure: "Structure des coûts...",
                          revenueStreams: "Flux de revenus..."
                        }
                      }
                    }, null, 2)}</pre>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      const jsonTemplate = {
                        project: {
                          context: {
                            titre: "Mon Projet BMC",
                            description: "Description de mon projet",
                            secteur: "Votre secteur",
                            stade: "prototype"
                          },
                          bmcData: {
                            keyPartners: "",
                            keyActivities: "",
                            valuePropositions: "",
                            customerRelationships: "",
                            customerSegments: "",
                            keyResources: "",
                            channels: "",
                            costStructure: "",
                            revenueStreams: ""
                          }
                        }
                      };
                      const blob = new Blob([JSON.stringify(jsonTemplate, null, 2)], { type: 'application/json' });
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(blob);
                      link.download = 'modele-bmc.json';
                      link.click();
                    }}
                    className="w-full mt-4"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger le modèle JSON
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}