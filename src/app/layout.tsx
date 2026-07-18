import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ramirez Atelier — Progetta il tuo arredo su misura',
  description:
    'Falegnameria artigiana specializzata in arredi su misura: cucine, living, cabine armadio, progetti su richiesta.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased">{children}</body>
    </html>
  );
}
