import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ramirez Atelier',
    short_name: 'Ramirez Atelier',
    description: 'Falegnameria artigiana e arredi su misura.',
    start_url: '/',
    display: 'standalone',
    background_color: '#F7F3EE',
    theme_color: '#F7F3EE',
    icons: [
      {
        src: '/apple-icon.svg',
        sizes: '180x180',
        type: 'image/svg+xml',
      },
      {
        src: '/icon.svg',
        sizes: '64x64',
        type: 'image/svg+xml',
      },
    ],
  };
}
