export interface ProjectContext {
  titre: string;
  description: string;
  secteur: string;
  stade: 'idee' | 'prototype' | 'lance' | 'croissance';
}

export interface BMCSection {
  id: keyof BMCData;
  title: string;
  content: string;
  placeholder: string;
  color: string;
  errors?: string[];
  suggestions?: string[];
  score?: number;
}

export interface BMCData {
  keyPartners: string;
  keyActivities: string;
  valuePropositions: string;
  customerRelationships: string;
  customerSegments: string;
  keyResources: string;
  channels: string;
  costStructure: string;
  revenueStreams: string;
}

export interface AIAnalysis {
  sectionId: keyof BMCData;
  errors: string[];
  suggestions: string[];
  score: number;
  examples: string[];
}

export interface ProjectData {
  id: string;
  name: string;
  lastModified: string;
  context: ProjectContext;
  bmcData: BMCData;
}