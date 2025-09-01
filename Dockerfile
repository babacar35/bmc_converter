# Multi-stage build pour optimiser la taille de l'image
FROM node:18-alpine AS base

# Installation des dépendances
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copie des fichiers de dépendances
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Build de l'application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variables d'environnement pour le build
ENV NEXT_TELEMETRY_DISABLED 1

# Build de l'application Next.js
RUN npm run build

# Image de production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Création de l'utilisateur non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copie des fichiers nécessaires
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Attribution des permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]