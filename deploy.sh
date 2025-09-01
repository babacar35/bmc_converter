#!/bin/bash

# 🚀 Script de déploiement BMC Correcteur - Docker
# Utilisation: ./deploy.sh [dev|prod]

set -e

echo "🚀 Déploiement BMC Correcteur avec Docker"
echo "========================================="

# Variables
MODE=${1:-prod}
COMPOSE_FILE="docker-compose.yml"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

# Vérifications préalables
check_requirements() {
    log "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker n'est pas installé"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose n'est pas installé"
    fi
    
    if [ ! -f ".env.production" ]; then
        warning "Fichier .env.production non trouvé"
        warning "Copie de .env.local.example vers .env.production"
        cp .env.local.example .env.production
    fi
    
    log "✅ Prérequis validés"
}

# Arrêt des conteneurs existants
stop_containers() {
    log "Arrêt des conteneurs existants..."
    docker-compose down --remove-orphans || true
    log "✅ Conteneurs arrêtés"
}

# Construction et démarrage
start_containers() {
    log "Construction de l'image Docker..."
    docker-compose build --no-cache
    
    log "Démarrage des services..."
    if [ "$MODE" = "dev" ]; then
        docker-compose up -d --remove-orphans
    else
        docker-compose up -d --remove-orphans bmc-correcteur
    fi
    
    log "✅ Services démarrés"
}

# Vérification de l'état des services
check_health() {
    log "Vérification de l'état des services..."
    
    # Attendre que l'application soit prête
    for i in {1..30}; do
        if curl -f http://localhost:3000 > /dev/null 2>&1; then
            log "✅ Application accessible sur http://localhost:3000"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    warning "L'application met du temps à démarrer, vérifiez les logs:"
    warning "docker-compose logs -f bmc-correcteur"
}

# Affichage des logs
show_logs() {
    log "Affichage des logs (Ctrl+C pour quitter):"
    docker-compose logs -f bmc-correcteur
}

# Nettoyage
cleanup() {
    log "Nettoyage des images inutilisées..."
    docker system prune -f > /dev/null 2>&1 || true
    log "✅ Nettoyage terminé"
}

# Menu principal
main() {
    echo -e "${BLUE}"
    echo "Mode de déploiement: $MODE"
    echo -e "${NC}"
    
    check_requirements
    stop_containers
    start_containers
    check_health
    
    if [ "$MODE" = "dev" ]; then
        show_logs
    else
        cleanup
        log "🎉 Déploiement terminé avec succès!"
        log "📱 Application disponible sur: http://localhost:3000"
        log "📋 Voir les logs: docker-compose logs -f bmc-correcteur"
        log "🛑 Arrêter: docker-compose down"
    fi
}

# Gestion des signaux
trap 'error "Déploiement interrompu"' SIGINT SIGTERM

# Exécution
main