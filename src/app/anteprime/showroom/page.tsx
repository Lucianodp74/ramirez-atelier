import type { Metadata } from 'next';
import { Esperienza } from './_componenti/Esperienza';

// Anteprima isolata (Fase B): non indicizzata, fuori sitemap, non sostituisce la home.
export const metadata: Metadata = {
  title: 'Anteprima · Showroom 3D | Ramirez Atelier',
  description: 'Anteprima sperimentale dello showroom 3D di Ramirez Atelier.',
  robots: { index: false, follow: false },
};

export default function ShowroomAnteprima() {
  return <Esperienza />;
}
