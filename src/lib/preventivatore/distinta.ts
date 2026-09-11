import type { ModuloConfigurato } from './moduli';

export type ComponenteDistinta = {
  codice: string;
  voce: string;
  quantita: number;
  unita: 'PZ' | 'M2' | 'ML' | 'H';
  larghezzaCm?: number;
  altezzaCm?: number;
  profonditaCm?: number;
  note?: string;
};

export function generaDistintaParametrica(modulo: ModuloConfigurato, ripiani: number, porte: number, cassetti: number, bordoMl: number, ore: number): ComponenteDistinta[] {
  const w = modulo.larghezzaCm;
  const h = modulo.altezzaCm;
  const d = modulo.profonditaCm;
  return [
    { codice: 'PANNELLO-FIANCO', voce: 'Fianco', quantita: 2, unita: 'PZ', larghezzaCm: d, altezzaCm: h },
    { codice: 'PANNELLO-BASE', voce: 'Base', quantita: 1, unita: 'PZ', larghezzaCm: w, altezzaCm: d },
    { codice: 'PANNELLO-CIELO', voce: 'Cielo', quantita: 1, unita: 'PZ', larghezzaCm: w, altezzaCm: d },
    ...Array.from({ length: ripiani }, (_, i) => ({ codice: `RIPIANO-${i + 1}`, voce: `Ripiano ${i + 1}`, quantita: 1, unita: 'PZ' as const, larghezzaCm: w, altezzaCm: d })),
    ...(porte > 0 ? [{ codice: 'ANTA', voce: 'Anta', quantita: porte, unita: 'PZ' as const, larghezzaCm: Math.round((w / porte) * 100) / 100, altezzaCm: h, note: 'Larghezza teorica: giochi e battute da verificare' }] : []),
    ...(cassetti > 0 ? [{ codice: 'FRONTALE-CASSETTO', voce: 'Frontale cassetto', quantita: cassetti, unita: 'PZ' as const, larghezzaCm: w, altezzaCm: Math.round((h / cassetti) * 100) / 100, note: 'Dimensione teorica: guide, giochi e composizione da verificare' }] : []),
    { codice: 'SCHIENALE', voce: 'Schienale', quantita: 1, unita: 'PZ', larghezzaCm: w, altezzaCm: h, note: 'Dimensione teorica, spessore e battuta da verificare' },
    { codice: 'BORDO-ML', voce: 'Bordatura', quantita: Math.round(bordoMl * 100) / 100, unita: 'ML' },
    ...(porte + cassetti > 0 ? [{ codice: 'FER-HARDWARE', voce: 'Ferramenta', quantita: porte + cassetti, unita: 'PZ' as const }] : []),
    { codice: 'MAN-ORE', voce: 'Lavorazione e assemblaggio', quantita: Math.round(ore * 100) / 100, unita: 'H' },
  ];
}
