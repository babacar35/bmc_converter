'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProjectContext } from '@/types/bmc';

interface ProjectContextFormProps {
  onContextSubmit: (context: ProjectContext) => void;
  initialContext?: ProjectContext;
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

export function ProjectContextForm({ onContextSubmit, initialContext }: ProjectContextFormProps) {
  const [context, setContext] = useState<ProjectContext>(
    initialContext || {
      titre: '',
      description: '',
      secteur: '',
      stade: 'idee'
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (context.titre && context.description && context.secteur) {
      onContextSubmit(context);
    }
  };

  const isValid = context.titre && context.description && context.secteur;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">BMC</span>
          </div>
          Context du Projet
        </CardTitle>
        <CardDescription>
          Renseignez les informations de base pour optimiser l&apos;analyse IA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Titre du projet *</label>
            <input
              type="text"
              value={context.titre}
              onChange={(e) => setContext({ ...context, titre: e.target.value })}
              placeholder="Ex: Application de livraison de repas"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description courte *</label>
            <textarea
              value={context.description}
              onChange={(e) => setContext({ ...context, description: e.target.value })}
              placeholder="Décrivez votre projet en 2-3 phrases..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Secteur d&apos;activité *</label>
            <div className="flex flex-wrap gap-2">
              {secteurs.map((secteur) => (
                <Badge
                  key={secteur}
                  variant={context.secteur === secteur ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setContext({ ...context, secteur })}
                >
                  {secteur}
                </Badge>
              ))}
            </div>
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

          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isValid}
          >
            Commencer l&apos;analyse BMC
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}