'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormVariante } from './FormVariante';
import type { CampoPersonalizzabile } from '@/server/services/variante-preimpostata-service';

interface Variante {
  id: string;
  nome: string;
  descrizione: string | null;
  scelte: Record<string, string>;
  attiva: boolean;
  ordinamento: number;
}

interface Dati {
  tipoProgettoId: string;
  nome: string;
  descrizione?: string | null;
  scelte: Record<string, string>;
  ordinamento?: number;
}

export function RigaVariante({
  variante,
  tipoProgettoId,
  campiPersonalizzabili,
  azioneCrea,
  azioneAggiorna,
  azioneImpostaAttiva,
  azioneElimina,
}: {
  variante: Variante;
  tipoProgettoId: string;
  campiPersonalizzabili: CampoPersonalizzabile[];
  azioneCrea: (dati: Dati) => Promise<unknown>;
  azioneAggiorna: (id: string, dati: Partial<Omit<Dati, 'tipoProgettoId'>>) => Promise<unknown>;
  azioneImpostaAttiva: (id: string, attiva: boolean) => Promise<void>;
  azioneElimina: (id: string) => Promise<{ successo: boolean; errore?: string }>;
}) {
  const router = useRouter();
  const [inModifica, setInModifica] = useState(false);
  const [errore, setErrore] = useState<string | null>(null);
  const [inCorso, iniziaTransizione] = useTransition();

  if (inModifica) {
    return (
      <div className="rounded-lg border border-border bg-secondary/20 p-4">
        <FormVariante
          tipoProgettoId={tipoProgettoId}
          campiPersonalizzabili={campiPersonalizzabili}
          varianteEsistente={variante}
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
          <span className="font-medium">{variante.nome}</span>
          <Badge variant={variante.attiva ? 'accent' : 'outline'}>
            {variante.attiva ? 'Attiva' : 'Disattivata'}
          </Badge>
        </div>
        {variante.descrizione && (
          <p className="mt-0.5 text-sm text-muted-foreground">{variante.descrizione}</p>
        )}
        {Object.keys(variante.scelte).length > 0 && (
          <p className="mt-1 text-xs text-muted-foreground">
            {Object.entries(variante.scelte)
              .map(([k, v]) => `${k}: ${v}`)
              .join(' · ')}
          </p>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setInModifica(true)}>
            Modifica
          </Button>
          <Button
            type="button"
            variant={variante.attiva ? 'outline' : 'accent'}
            size="sm"
            disabled={inCorso}
            onClick={() =>
              iniziaTransizione(async () => {
                await azioneImpostaAttiva(variante.id, !variante.attiva);
                router.refresh();
              })
            }
          >
            {variante.attiva ? 'Disattiva' : 'Riattiva'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={inCorso}
            onClick={() =>
              iniziaTransizione(async () => {
                setErrore(null);
                const risultato = await azioneElimina(variante.id);
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
