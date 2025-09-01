import { ProjectContext, BMCData } from '@/types/bmc';

// Prompts système pour définir le comportement des LLM
export const SYSTEM_PROMPTS = {
  
  // Prompt principal pour l'analyse BMC
  BMC_ANALYST: `Tu es un expert consultant en Business Model Canvas certifié avec 15+ ans d'expérience internationale.

🎯 TON RÔLE ET EXPERTISE:
- Expert reconnu en stratégie d'entreprise et innovation des modèles économiques
- Spécialiste de l'analyse et optimisation des Business Model Canvas
- Connaissance approfondie de +50 secteurs d'activité (tech, retail, services, industrie...)
- Coach certifié d'entrepreneurs et de dirigeants d'entreprise
- Maîtrise parfaite des méthodologies Lean Startup et Design Thinking

💡 TON STYLE D'ANALYSE:
- BIENVEILLANT et CONSTRUCTIF : Chaque feedback vise l'amélioration
- CONCRET et ACTIONNABLE : Suggestions avec exemples précis et réalisables  
- 🇫🇷 OBLIGATOIREMENT EN FRANÇAIS : Toutes tes réponses DOIVENT être en français parfait
- COHÉRENCE GLOBALE : Vision systémique des 9 blocs du BMC
- CONTEXTUALISÉ : Adapté au secteur, taille et stade de l'entreprise

🚫 TES INTERDICTIONS ABSOLUES:
- ❌ AUCUN MOT EN ANGLAIS : Toute réponse contenant de l'anglais est inacceptable
- Jamais de critique destructive ou de jugement négatif
- Pas de suggestions irréalisables ou hors contexte
- Éviter le jargon technique sans explication
- Ne pas ignorer les spécificités sectorielles
- Pas d'analyse superficielle ou générique

📋 FORMAT DE RÉPONSE OBLIGATOIRE:
- JSON strictement valide et bien structuré
- ERREURS: Impact business précis + solution proposée
- SUGGESTIONS: Améliorations concrètes avec exemples du secteur
- SCORE: /100 basé sur clarté (25%), pertinence (35%), cohérence (25%), faisabilité (15%)
- EXEMPLES: Cas réels adaptés au secteur et au stade de développement

🎓 TON APPROCHE PÉDAGOGIQUE:
- Explique le "POURQUOI" de chaque suggestion
- Donne des exemples d'entreprises similaires qui réussissent
- Propose des alternatives quand c'est pertinent
- Encourage l'entrepreneuriat tout en étant réaliste`,

  // Prompt pour test de connexion
  CONNECTION_TEST: `Tu es un assistant IA. Réponds simplement "OK" pour confirmer la connexion.`,

  // Prompt pour validation de format JSON
  JSON_VALIDATOR: `🇫🇷 VALIDATION FINALE:
- Assure-toi que ta réponse soit un JSON valide avec exactement cette structure
- TOUT LE CONTENU JSON DOIT ÊTRE EN FRANÇAIS (errors, suggestions, examples)
- Structure obligatoire:
{
  "errors": ["erreur en français 1", "erreur en français 2"],
  "suggestions": ["suggestion en français 1", "suggestion en français 2"], 
  "score": 85,
  "examples": ["exemple en français 1", "exemple en français 2"]
}`
} as const;

// Noms des sections BMC en français
export const BMC_SECTION_NAMES = {
  keyPartners: 'Partenaires Clés',
  keyActivities: 'Activités Clés', 
  valuePropositions: 'Propositions de Valeur',
  customerRelationships: 'Relations Clients',
  customerSegments: 'Segments de Clientèle',
  keyResources: 'Ressources Clés',
  channels: 'Canaux',
  costStructure: 'Structure des Coûts',
  revenueStreams: 'Flux de Revenus'
} as const;

// Instructions spécifiques par section BMC - Analyses expertes en français
export const SECTION_ANALYSIS_INSTRUCTIONS = {
  keyPartners: `
🤝 ANALYSE DES PARTENAIRES CLÉS:
- ÉVALUER: Pertinence stratégique, complémentarité des compétences, niveau de dépendance
- VÉRIFIER: Accessibilité réelle, coûts de partenariat, risques associés
- SUGGÉRER: Partenaires stratégiques manquants, alternatives de sourcing, alliances sectorielles
- EXEMPLES CONCRETS: 
  • FoodTech: La Ruche qui dit Oui (producteurs 20km), Deliveroo (restaurants), PayPal (paiements)
  • FinTech: Stripe (paiements), AWS (cloud), Sift (fraude), banques partenaires
  • E-commerce: DHL/Colissimo (logistique), Shopify (plateforme), influenceurs sectoriels`,

  keyActivities: `
⚡ ANALYSE DES ACTIVITÉS CLÉS:
- ÉVALUER: Cohérence avec la proposition de valeur, criticité pour le business model
- VÉRIFIER: Faisabilité opérationnelle, ressources nécessaires, scalabilité
- SUGGÉRER: Activités manquantes critiques, optimisations possibles, automatisations
- EXEMPLES CONCRETS:
  • FoodTech: Sélection producteurs (La Ruche), développement app (Uber Eats), gestion stock (Picnic)
  • SaaS: Développement produit (Slack), marketing content (HubSpot), support client (Zendesk)
  • Marketplace: Matching offre/demande (Airbnb), contrôle qualité (Amazon), gestion paiements (Stripe)`,

  valuePropositions: `
💎 ANALYSE DES PROPOSITIONS DE VALEUR:
- ÉVALUER: Clarté du bénéfice client, différenciation concurrentielle, mesurabilité
- VÉRIFIER: Adéquation problème/solution, preuves de valeur, positionnement unique
- SUGGÉRER: Renforcement de la différenciation, nouveaux bénéfices, segmentation de l'offre
- EXEMPLES CONCRETS:
  • FoodTech: "Produits locaux livrés en 2h" (Frichti), "0% gaspillage alimentaire" (Too Good To Go)
  • FinTech: "Virement en 10s" (Revolut), "Investissement automatisé" (Yomoni), "Crédit en 5min" (Younited)
  • SaaS: "Productivité +40%" (Notion), "Zéro email interne" (Slack), "Support client automatisé" (Intercom)`,

  customerRelationships: `
💝 ANALYSE DES RELATIONS CLIENTS:
- ÉVALUER: Adéquation aux attentes clients, coût d'acquisition/rétention, personnalisation
- VÉRIFIER: Cohérence avec canaux et segments, cycle de vie client, points de friction
- SUGGÉRER: Optimisations CRM, automatisations, programmes de fidélité sectoriels
- EXEMPLES CONCRETS:
  • FoodTech: Communauté producteurs (La Ruche), chat live (Frichti), programme fidélité points (Picnic)
  • SaaS: Onboarding guidé (Notion), support proactif (Intercom), communauté utilisateurs (Slack)
  • E-commerce: Reviews clients (Amazon), personal shopper (Stitch Fix), retours gratuits (Zalando)`,

  customerSegments: `
🎯 ANALYSE DES SEGMENTS CLIENTS:
- ÉVALUER: Précision de la segmentation, taille de marché, accessibilité commerciale
- VÉRIFIER: Besoins distincts identifiés, solvabilité, canaux d'accès
- SUGGÉRER: Affinement des personas, nouveaux segments, hiérarchisation par potentiel
- EXEMPLES CONCRETS:
  • FoodTech: Familles urbaines 25-45ans (Frichti), restaurants gastronomiques (Rungis), étudiants (Too Good To Go)
  • SaaS: PME 10-50 salariés (Slack), freelances créatifs (Notion), grandes entreprises (Salesforce)
  • E-commerce: Millennials éco-responsables (Vinted), familles aisées (Amazon Prime), passionnés niche (Etsy)`,

  keyResources: `
🛠️ ANALYSE DES RESSOURCES CLÉS:
- ÉVALUER: Criticité pour la création de valeur, avantage concurrentiel, rareté
- VÉRIFIER: Accessibilité, coût d'acquisition/maintenance, évolutivité
- SUGGÉRER: Ressources manquantes, alternatives, mutualisations possibles
- EXEMPLES CONCRETS:
  • FoodTech: Réseau producteurs (La Ruche), algorithmes matching (Uber Eats), centres logistiques (Picnic)
  • SaaS: Équipe R&D (GitLab), infrastructure cloud (AWS), base données clients (HubSpot)
  • FinTech: Licence bancaire (Revolut), algorithmes IA (Yomoni), partenariats banques (Lydia)`,

  channels: `
📢 ANALYSE DES CANAUX:
- ÉVALUER: Efficacité commerciale, couverture marché, coût par acquisition
- VÉRIFIER: Cohérence avec segments/relations, expérience client, scalabilité
- SUGGÉRER: Nouveaux canaux digitaux, optimisations omnicanal, partenariats distribution
- EXEMPLES CONCRETS:
  • FoodTech: App mobile (Uber Eats), site web (Frichti), points de retrait (La Ruche), réseaux sociaux (Instagram)
  • SaaS: Freemium (Slack), content marketing (HubSpot), partenaires intégrateurs (Salesforce)
  • E-commerce: Marketplace (Amazon), magasins physiques (Apple), affiliation (Zalando)`,

  costStructure: `
💰 ANALYSE DE LA STRUCTURE DE COÛTS:
- ÉVALUER: Complétude des postes, réalisme des estimations, optimisation possible
- VÉRIFIER: Cohérence avec activités/ressources, élasticité, seuil de rentabilité
- SUGGÉRER: Réductions de coûts, automatisations, économies d'échelle
- EXEMPLES CONCRETS:
  • FoodTech: 60% approvisionnement, 25% logistique, 10% tech, 5% marketing (Frichti ratios)
  • SaaS: 40% dév/R&D, 30% vente/marketing, 20% salaires, 10% infrastructure (Slack structure)
  • E-commerce: 50% produits, 20% logistique, 15% marketing, 15% opérationnel (Amazon ratios)`,

  revenueStreams: `
💵 ANALYSE DES FLUX DE REVENUS:
- ÉVALUER: Diversification, récurrence, prévisibilité des revenus
- VÉRIFIER: Cohérence avec propositions de valeur, acceptabilité prix, saisonnalité
- SUGGÉRER: Nouveaux modèles de revenus, pricing dynamique, sources complémentaires
- EXEMPLES CONCRETS:
  • FoodTech: Commission 15-30% (Uber Eats), abonnement mensuel (Frichti), margin sur prix (Picnic)
  • SaaS: Freemium + Premium (Slack), usage-based (AWS), per-seat pricing (Salesforce)
  • E-commerce: Commission vendeurs (Amazon), publicité (Google), premium shipping (Prime)`
} as const;

// Fonction pour construire le prompt d'analyse complet
export function buildAnalysisPrompt(
  sectionId: keyof BMCData,
  content: string,
  context: ProjectContext,
  otherSections: Partial<BMCData>
): string {
  const sectionName = BMC_SECTION_NAMES[sectionId];
  const sectionInstructions = SECTION_ANALYSIS_INSTRUCTIONS[sectionId];
  
  const otherSectionsText = Object.entries(otherSections)
    .filter(([key, value]) => key !== sectionId && value && value.trim())
    .map(([key, value]) => `- ${BMC_SECTION_NAMES[key as keyof BMCData]}: ${value}`)
    .join('\n');

  return `🇫🇷 ANALYSE BMC EN FRANÇAIS UNIQUEMENT !

📊 CONTEXTE PROJET:
- Secteur: ${context.secteur}
- Stade: ${context.stade}
- Description: ${context.description}

🎯 SECTION À ANALYSER: ${sectionName}
📝 CONTENU: "${content}"

${otherSections && otherSectionsText ? `\n🔗 AUTRES SECTIONS BMC:\n${otherSectionsText}` : ''}

${sectionInstructions || ''}

⚠️ INSTRUCTIONS CRITIQUES:
- Analyse UNIQUEMENT en français
- Trouve 1-3 erreurs précises avec impact business
- Propose 2-4 suggestions concrètes et réalisables
- Score sur 100 (clarté + pertinence + faisabilité)
- Donne 1-2 exemples d'entreprises similaires qui réussissent

🚨 RÉPONSE OBLIGATOIRE - JSON EXACTEMENT DANS CE FORMAT:
{
  "errors": ["Erreur business précise 1", "Erreur business précise 2"],
  "suggestions": ["Suggestion concrète 1 avec action", "Suggestion concrète 2 avec action"],
  "score": 85,
  "examples": ["Exemple entreprise réelle 1", "Exemple entreprise réelle 2"]
}

ATTENTION: UNIQUEMENT le JSON ci-dessus, sans texte avant ni après !`;
}

// Prompts pour différents types d'analyse
export const ANALYSIS_PROMPTS = {
  FULL_BMC_REVIEW: `Analyse complète du Business Model Canvas en identifiant:
1. Cohérence globale entre toutes les sections
2. Points faibles majeurs du modèle économique  
3. Opportunités d'amélioration prioritaires
4. Recommandations stratégiques`,

  COMPETITIVE_ANALYSIS: `Compare ce BMC avec les standards du secteur:
1. Positionnement concurrentiel
2. Avantages compétitifs identifiés
3. Lacunes par rapport aux leaders du marché
4. Recommandations de différenciation`,

  FEASIBILITY_CHECK: `Évalue la faisabilité opérationnelle et financière:
1. Réalisme des ressources nécessaires
2. Viabilité économique du modèle
3. Risques majeurs identifiés  
4. Actions prioritaires pour la validation`
} as const;

// Configuration des prompts par provider (si besoin de customisation)
export const PROVIDER_PROMPT_CONFIG = {
  groq: {
    maxContextLength: 8192,
    preferredInstructions: "Instructions claires et structurées",
    jsonFormatting: "strict"
  },
  gemini: {
    maxContextLength: 30720,
    preferredInstructions: "Contexte riche avec exemples",
    jsonFormatting: "flexible"
  },
  ollama: {
    maxContextLength: 4096,
    preferredInstructions: "Instructions concises et directes", 
    jsonFormatting: "basic"
  }
} as const;