# 📊 BMC Correcteur

Application web intelligente pour l'analyse et la correction de Business Model Canvas (BMC) utilisant l'IA.

## 🚀 Fonctionnalités

- **Analyse IA avancée** : Correction automatique des BMC avec Groq, Gemini ou Ollama
- **Interface intuitive** : Design moderne avec Next.js 15 et Tailwind CSS
- **Multi-providers LLM** : Support de plusieurs fournisseurs d'IA
- **Export PDF** : Génération de rapports de correction professionnels
- **Mode sombre** : Interface adaptable jour/nuit

## 🛠️ Technologies

- **Frontend** : Next.js 15, React 19, TypeScript
- **UI** : Tailwind CSS, Radix UI, Shadcn/ui
- **IA** : Groq (Llama 3.1), Google Gemini, Ollama
- **Deployment** : Docker, Docker Compose

## ⚡ Installation Rapide

### Développement Local

```bash
# Cloner le projet
git clone <repository-url>
cd bmc-correcteur

# Installer les dépendances
npm install

# Configurer l'environnement
cp .env.local.example .env.local
# Éditer .env.local avec vos clés API

# Démarrer en mode développement
npm run dev
```

L'application sera accessible sur [http://localhost:3000](http://localhost:3000)

## 🐳 Déploiement Docker

### Prérequis
- Docker et Docker Compose installés
- Serveur Ubuntu 24.04+ recommandé
- 4 Go RAM minimum, 8 Go recommandés

### Déploiement Production

```bash
# Configurer l'environnement production
cp .env.local.example .env.production
# Éditer .env.production avec vos configurations

# Déployer avec le script automatisé
chmod +x deploy.sh
./deploy.sh prod
```

### Déploiement Manuel

```bash
# Construction et démarrage
docker-compose build
docker-compose up -d

# Vérifier l'état
docker-compose ps
docker-compose logs -f bmc-correcteur
```

## 🔧 Configuration

### Variables d'Environnement

```env
# Providers IA (configurer au moins un)
NEXT_PUBLIC_GROQ_API_KEY=your_groq_api_key
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_OLLAMA_BASE_URL=http://localhost:11434

# Configuration serveur
NEXT_PUBLIC_BASE_URL=http://your-server:3000
NODE_ENV=production
```

### Providers IA Supportés

1. **Groq** (Recommandé) - Gratuit, ultra-rapide
   - Inscription : [console.groq.com](https://console.groq.com/keys)
   - Modèle : Llama 3.1 70B

2. **Google Gemini** - IA multimodale puissante  
   - Inscription : [aistudio.google.com](https://aistudio.google.com/app/apikey)
   - Modèle : Gemini 1.5 Pro

3. **Ollama** - Modèles locaux privés
   - Installation : [ollama.ai](https://ollama.ai/download)
   - Commande : `ollama pull llama3.1`

## 📁 Structure du Projet

```
bmc-correcteur/
├── app/                    # Pages et API routes (App Router)
├── components/             # Composants React réutilisables
├── lib/                   # Utilitaires et configurations
├── public/                # Assets statiques
├── types/                 # Définitions TypeScript
├── docker-compose.yml     # Configuration Docker
├── Dockerfile            # Image de production
├── deploy.sh            # Script de déploiement
└── .env.production      # Variables d'environnement prod
```

## 🔍 API

L'application expose une API REST pour l'analyse des BMC :

- `POST /api/analyze` - Analyser un BMC
- `GET /api/health` - État de santé de l'application

## 🚀 Scripts Disponibles

```bash
npm run dev        # Développement avec Turbopack
npm run build      # Construction production
npm run start      # Démarrage production
npm run lint       # Vérification du code
```

## 📊 Monitoring

### Santé de l'Application
```bash
# Vérifier l'état des conteneurs
docker-compose ps

# Voir les logs en temps réel
docker-compose logs -f bmc-correcteur

# Vérifier la santé de l'API
curl http://localhost:3000/api/health
```

### Métriques Docker
```bash
# Utilisation des ressources
docker stats bmc-correcteur-app

# Espace disque
docker system df
```

## 🛠️ Maintenance

### Mise à Jour

```bash
# Récupérer les derniers changements
git pull

# Redéployer
./deploy.sh prod
```

### Sauvegarde

```bash
# Sauvegarder les données
docker run --rm -v bmc-correcteur_app_data:/data -v $(pwd):/backup ubuntu tar czf /backup/backup.tar.gz /data
```

### Nettoyage

```bash
# Nettoyer les images inutilisées
docker system prune -a

# Arrêter tous les services
docker-compose down --remove-orphans
```

## 🔒 Sécurité

- Variables d'environnement sécurisées
- Image Docker non-root
- Validation des entrées utilisateur
- HTTPS recommandé en production

## 📝 Contribuer

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/amazing-feature`)
3. Commit les changements (`git commit -m 'Add amazing feature'`)
4. Push vers la branche (`git push origin feature/amazing-feature`)
5. Ouvrir une Pull Request

## 📞 Support

- 📧 Support technique : Créer une issue GitHub
- 📖 Documentation : Voir les fichiers `/docs`
- 🌐 Démo : [http://localhost:3000](http://localhost:3000)

## 📜 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.
