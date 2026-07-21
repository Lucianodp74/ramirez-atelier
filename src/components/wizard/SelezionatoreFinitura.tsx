'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import type { OpzioneCampo } from '@/lib/tipo-progetto-schema';

interface Props {
  opzioni: OpzioneCampo[];
  valore: unknown;
  onSeleziona: (valore: string) => void;
}

/** Etichette leggibili per le categorie note - puramente cosmetico: una categoria
 * non presente in questa mappa resta comunque pienamente funzionante, mostrata
 * con il proprio nome capitalizzato (nessuna assunzione rigida sul catalogo). */
const ETICHETTE_CATEGORIA: Record<string, string> = {
  legno: 'Legno',
  laccato: 'Laccato',
  laminato: 'Laminato',
  pietra_marmo: 'Pietra e Marmo',
  vetro: 'Vetro',
  metallo: 'Metallo',
  tessuto_ecopelle: 'Tessuto ed Ecopelle',
};

function etichettaCategoria(categoria: string): string {
  return (
    ETICHETTE_CATEGORIA[categoria] ??
    categoria.charAt(0).toUpperCase() + categoria.slice(1).replace(/_/g, ' ')
  );
}

/** Genera il campione visivo via CSS puro, a partire da colore+texture - nessuna
 * immagine caricata (v. Finitura, ADR-0006): zero dipendenza dallo storage. */
function stileCampione(coloreHex: string, texture?: string): React.CSSProperties {
  const base: React.CSSProperties = { backgroundColor: coloreHex };
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

/**
 * Usato quando le opzioni di un campo select_immagine portano un coloreHex (oggi:
 * il catalogo Finiture) - genera un campione visivo via CSS, con ricerca live e
 * raggruppamento per categoria. Ignaro di dominio: non sa cosa sia una "finitura",
 * riceve solo OpzioneCampo generiche.
 */
export function SelezionatoreFinitura({ opzioni, valore, onSeleziona }: Props) {
  const [ricerca, setRicerca] = useState('');

  const gruppi = useMemo(() => {
    const testoRicerca = ricerca.trim().toLowerCase();
    const filtrate = testoRicerca
      ? opzioni.filter(
          (o) =>
            o.etichetta.toLowerCase().includes(testoRicerca) ||
            (o.descrizione ?? '').toLowerCase().includes(testoRicerca),
        )
      : opzioni;

    const mappa = new Map<string, OpzioneCampo[]>();
    for (const opzione of filtrate) {
      const chiave = opzione.categoria ?? '';
      if (!mappa.has(chiave)) mappa.set(chiave, []);
      mappa.get(chiave)!.push(opzione);
    }
    return [...mappa.entries()];
  }, [opzioni, ricerca]);

  const nessunRisultato = gruppi.length === 0;

  return (
    <div className="space-y-5">
      {opzioni.length > 8 && (
        <input
          type="text"
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          placeholder="Cerca per nome..."
          className="w-full rounded-md border border-input bg-secondary/40 px-3 py-2 text-sm"
        />
      )}

      {nessunRisultato && (
        <p className="text-sm text-muted-foreground">
          Nessuna finitura trovata per &quot;{ricerca}&quot;.
        </p>
      )}

      {gruppi.map(([categoria, opzioniGruppo]) => (
        <div key={categoria} className="space-y-2">
          {categoria && (
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {etichettaCategoria(categoria)}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {opzioniGruppo.map((opzione) => (
              <button
                key={opzione.valore}
                type="button"
                onClick={() => onSeleziona(opzione.valore)}
                className={cn(
                  'group overflow-hidden rounded-lg border text-left transition-colors',
                  valore === opzione.valore
                    ? 'border-accent'
                    : 'border-input hover:border-muted-foreground',
                )}
              >
                <div
                  className="aspect-[4/3]"
                  style={
                    opzione.coloreHex
                      ? stileCampione(opzione.coloreHex, opzione.texture)
                      : undefined
                  }
                />
                <div className="p-3">
                  <div className="text-sm font-medium">{opzione.etichetta}</div>
                  {opzione.descrizione && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {opzione.descrizione}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
