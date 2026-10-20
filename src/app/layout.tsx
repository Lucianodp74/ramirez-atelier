import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans-loaded',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://ramirezatelier.it'),
  title: 'Ramirez Atelier — Progetta il tuo arredo su misura',
  description:
    'Falegnameria artigiana specializzata in arredi su misura: cucine, living, cabine armadio, progetti su richiesta.',
  openGraph: {
    type: 'website',
    locale: 'it_IT',
    url: 'https://ramirezatelier.it',
    siteName: 'RAMIREZ ATELIER',
    title: 'Ramirez Atelier — Progetta il tuo arredo su misura',
    description:
      'Falegnameria artigiana specializzata in arredi su misura: cucine, living, cabine armadio, progetti su richiesta.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'RAMIREZ ATELIER — Arredi su misura' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ramirez Atelier — Progetta il tuo arredo su misura',
    description:
      'Falegnameria artigiana specializzata in arredi su misura: cucine, living, cabine armadio, progetti su richiesta.',
    images: ['/opengraph-image'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className={`${fraunces.variable} ${inter.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
