import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mode standalone pour Docker
  output: 'standalone',
  
  // Configuration pour les images optimisées
  images: {
    unoptimized: true,
  },
  
  // Configuration pour les assets statiques
  trailingSlash: true,
  
  // Désactiver la vérification strict mode en production si nécessaire
  experimental: {
    turbopack: false, // Désactiver turbopack en production
  },
};

export default nextConfig;
