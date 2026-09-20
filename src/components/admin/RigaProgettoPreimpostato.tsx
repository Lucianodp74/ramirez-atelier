'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormProgettoPreimpostato } from './FormProgettoPreimpostato';
import type { DatiProgettoPreimpostato } from '@/server/services/progetto-preimpostato-service';

interface Progetto {
  id: string;
  nome: string;
  categoria: string;
  descrizione: string | null;
  immagine: string | null;
  moduli: unknown;
  pubblicata: boolean;
  ordinamento: number;
}

export function RigaProgettoPreimpostato({
  progetto,
  azioneCrea,
  azioneAggiorna,
  azioneImpostaPubblicazione,
  azioneElimina,
}: {
  progetto: Progetto;
  azioneCrea: (dati: DatiProgettoPreimpostato) => Promise<unknown>;
  azioneAggiorna: (id: string, dati: Partial<DatiProgettoPreimpostato>) => Promise<unknown>;
  azioneImpostaPubblicazione: (id: string, pubblicata: boolean) => Promise<void>;
  azioneElimina: (id: string) => Promise<{ successo: boolean; errore?: string }>;
}) {
  const router = useRouter();
  const [inModifica, setInModifica] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, iniziaTransizione] = useTransition();

  const numeroModuli = Array.isArray(progetto.moduli) ? progetto.moduli.length : 0;

  if (inModifica) {
    return (
      <div className="rounded-lg border border-border bg-secondary/20 p-4">
        <FormProgettoPreimpostato
          progettoEsistente={progetto}
          azioneCrea={azioneCrea}
          azioneAggiorna={azioneAggiorna}
          onCompletato={() => setInModifica(false)}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium">{progetto.nome}</span>
          <Badge variant="outline">{progetto.categoria}</Badge>
          <Badge variant={progetto.pubblicata ? 'accent' : 'outline'}>
            {progetto.pubblicata ? 'Pubblicata' : 'Bozza'}
          </Badge>
        </div>
        {progetto.descrizione && (
          <p className="mt-0.5 text-sm text-muted-foreground">{progetto.descrizione}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          {numeroModuli} modul{numeroModuli === 1 ? 'o' : 'i'}
          {progetto.immagine ? ` · ${progetto.immagine}` : ''}
        </p>
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setInModifica(true)}>
            Modifica
          </Button>
          <Button
            type="button"
            variant={progetto.pubblicata ? 'outline' : 'accent'}
            size="sm"
            disabled={inCorso}
            onClick={() =>
              iniziaTransizione(async () => {
                await azioneImpostaPubblicazione(progetto.id, !progetto.pubblicata);
                router.refresh();
              })
            }
          >
            {progetto.pubblicata ? 'Ritira' : 'Pubblica'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={inCorso}
            onClick={() =>
              iniziaTransizione(async () => {
                setErrore(null);
                const risultato = await azioneElimina(progetto.id);
                if (!risultato.successo) {
                  setErrore(risultato.errore ?? 'Impossibile eliminare.');
                } else {
                  router.refresh();
                }
              })
            }
          >
            Elimina
          </Button>
        </div>
        {errore && <p className="mt-2 max-w-xs text-right text-xs text-destructive">{errore}</p>}
      </div>
    </div>
  );
}
