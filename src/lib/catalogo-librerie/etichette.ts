import type { Finitura, Materiale } from '@/lib/preventivatore/moduli';

/**
 * Etichette leggibili di materiali e finiture per le schede del catalogo.
 * Stessi nomi già mostrati dal Preventivatore (dove oggi sono costanti
 * private del componente): se cambiano là, vanno allineati qui.
 */
export const ETICHETTE_MATERIALE: Record<Materiale, string> = {
  TRUCIOLARE: 'Truciolare',
  MDF: 'MDF',
  MULTISTRATO: 'Multistrato',
};

export const ETICHETTE_FINITURA: Record<Finitura, string> = {
  MELAMINICO: 'Melaminico',
  LAMINATO: 'Laminato',
  LACCATO: 'Laccato',
};
