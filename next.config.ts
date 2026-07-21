import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      // Default di Next.js (1MB) troppo basso per foto/PDF/disegni tecnici
      // caricati nello step "Documenti e riferimenti" del wizard.
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;
