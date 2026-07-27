'use client';

import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stileCampione } from '@/lib/campione-materiale';
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
                  'group relative overflow-hidden rounded-lg border text-left transition-all',
                  valore === opzione.valore
                    ? 'border-accent ring-2 ring-accent ring-offset-2 ring-offset-background'
                    : 'border-input hover:border-muted-foreground',
                )}
              >
                {valore === opzione.valore && (
                  <span className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-md">
                    <Check className="h-4 w-4" strokeWidth={3} />
                  </span>
                )}
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
