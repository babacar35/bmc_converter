'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectContext } from '@/types/bmc';
import { X } from 'lucide-react';

interface NewProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreate: (context: ProjectContext) => void;
}

const secteurs = [
  'E-commerce', 'SaaS', 'Fintech', 'Healthtech', 'Edtech', 
  'Food & Beverage', 'Mode', 'Immobilier', 'Transport', 'Autre'
];

const stades = [
  { value: 'idee', label: 'Idée' },
  { value: 'prototype', label: 'Prototype' },
  { value: 'lance', label: 'Lancé' },
  { value: 'croissance', label: 'Croissance' }
] as const;

export function NewProjectDialog({ isOpen, onClose, onProjectCreate }: NewProjectDialogProps) {
  const [context, setContext] = useState<ProjectContext>({
    titre: '',
    description: '',
    secteur: '',
    stade: 'idee'
  });

  const [errors, setErrors] = useState<{
    titre?: string;
    description?: string;
    secteur?: string;
  }>({});

  const [touched, setTouched] = useState<{
    titre?: boolean;
    description?: boolean;
    secteur?: boolean;
  }>({});

  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'titre':
        if (!value.trim()) return 'Le titre est requis';
        if (value.trim().length < 3) return 'Le titre doit contenir au moins 3 caractères';
        if (value.trim().length > 100) return 'Le titre ne peut pas dépasser 100 caractères';
        return undefined;
      case 'description':
        if (!value.trim()) return 'La description est requise';
        if (value.trim().length < 10) return 'La description doit contenir au moins 10 caractères';
        if (value.trim().length > 500) return 'La description ne peut pas dépasser 500 caractères';
        return undefined;
      case 'secteur':
        if (!value.trim()) return 'Veuillez sélectionner un secteur d\'activité';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleFieldChange = (field: keyof ProjectContext, value: string) => {
    setContext(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFieldBlur = (field: string, value: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ titre: true, description: true, secteur: true });
    
    // Validate all fields
    const newErrors = {
      titre: validateField('titre', context.titre),
      description: validateField('description', context.description),
      secteur: validateField('secteur', context.secteur),
    };
    
    setErrors(newErrors);
    
    // Check if form is valid
    const isValid = !newErrors.titre && !newErrors.description && !newErrors.secteur;
    
    if (isValid) {
      onProjectCreate(context);
      setContext({
        titre: '',
        description: '',
        secteur: '',
        stade: 'idee'
      });
      setErrors({});
      setTouched({});
      onClose();
    }
  };

  const isValid = !errors.titre && !errors.description && !errors.secteur && 
                  context.titre.trim() && context.description.trim() && context.secteur.trim();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">BMC</span>
              </div>
              <div>
                <CardTitle>Nouveau Projet</CardTitle>
                <CardDescription>
                  Renseignez les informations de base pour optimiser l&apos;analyse IA
                </CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre du projet *</label>
              <input
                type="text"
                value={context.titre}
                onChange={(e) => handleFieldChange('titre', e.target.value)}
                onBlur={(e) => handleFieldBlur('titre', e.target.value)}
                placeholder="Ex: Application de livraison de repas"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  touched.titre && errors.titre 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {touched.titre && errors.titre && (
                <p className="text-sm text-red-600 mt-1">{errors.titre}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description courte *</label>
              <textarea
                value={context.description}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                onBlur={(e) => handleFieldBlur('description', e.target.value)}
                placeholder="Décrivez votre projet en 2-3 phrases..."
                rows={3}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  touched.description && errors.description 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
              />
              {touched.description && errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Secteur d&apos;activité *</label>
              <div className="flex flex-wrap gap-2">
                {secteurs.map((secteur) => (
                  <Badge
                    key={secteur}
                    variant={context.secteur === secteur ? "default" : "outline"}
                    className={`cursor-pointer ${
                      touched.secteur && errors.secteur 
                        ? 'ring-1 ring-red-300' 
                        : ''
                    }`}
                    onClick={() => {
                      handleFieldChange('secteur', secteur);
                      handleFieldBlur('secteur', secteur);
                    }}
                  >
                    {secteur}
                  </Badge>
                ))}
              </div>
              {touched.secteur && errors.secteur && (
                <p className="text-sm text-red-600 mt-1">{errors.secteur}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Stade de développement</label>
              <div className="flex gap-2">
                {stades.map(({ value, label }) => (
                  <Badge
                    key={value}
                    variant={context.stade === value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setContext({ ...context, stade: value })}
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={!isValid}
              >
                Créer le projet
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}