import type { CSSProperties } from 'react';

/** Genera il campione visivo via CSS puro, a partire da colore+texture -
 * nessuna immagine caricata (v. Finitura, ADR-0006): zero dipendenza dallo
 * storage. Condivisa tra il selettore del wizard e la homepage pubblica -
 * un solo posto che decide come appare una finitura, mai duplicato. */
export function stileCampione(coloreHex: string, texture?: string): CSSProperties {
  const base: CSSProperties = { backgroundColor: coloreHex };
  switch (texture) {
    case 'legno':
      return {
        ...base,
        backgroundImage: `repeating-linear-gradient(115deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 2px, transparent 2px, transparent 7px)`,
      };
    case 'pietra':
      return {
        ...base,
        backgroundImage: `radial-gradient(rgba(255,255,255,0.15) 15%, transparent 16%), radial-gradient(rgba(0,0,0,0.1) 15%, transparent 16%)`,
        backgroundSize: '11px 11px, 7px 7px',
        backgroundPosition: '0 0, 4px 4px',
      };
    case 'metallo':
      return {
        ...base,
        backgroundImage: `linear-gradient(100deg, rgba(255,255,255,0.35) 0%, transparent 25%, rgba(255,255,255,0.15) 50%, transparent 75%, rgba(255,255,255,0.3) 100%)`,
      };
    case 'tessuto':
      return {
        ...base,
        backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,0.06) 0px, transparent 1.5px, transparent 4px), repeating-linear-gradient(90deg, rgba(0,0,0,0.06) 0px, transparent 1.5px, transparent 4px)`,
      };
    default: // 'liscio' (laccato/laminato) e fallback
      return {
        ...base,
        backgroundImage: `linear-gradient(135deg, rgba(255,255,255,0.2) 0%, transparent 60%)`,
      };
  }
}
