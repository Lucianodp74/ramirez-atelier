'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormCatalogoSemplice } from './FormCatalogoSemplice';

interface Riga {
  id: string;
  categoria: string;
  nome: string;
  descrizione: string | null;
  attiva: boolean;
  ordinamento: number;
}

interface Dati {
  categoria: string;
  nome: string;
  descrizione?: string | null;
  ordinamento?: number;
}

export function RigaCatalogoSemplice({
  riga,
  categorieEsistenti,
  azioneCrea,
  azioneAggiorna,
  azioneImpostaAttiva,
  azioneElimina,
}: {
  riga: Riga;
  categorieEsistenti: string[];
  azioneCrea: (dati: Dati) => Promise<unknown>;
  azioneAggiorna: (id: string, dati: Partial<Dati>) => Promise<unknown>;
  azioneImpostaAttiva: (id: string, attiva: boolean) => Promise<void>;
  azioneElimina: (id: string) => Promise<{ successo: boolean; errore?: string }>;
}) {
  const router = useRouter();
  const [inModifica, setInModifica] = useState(false);
  const [erroreEliminazione, setErroreEliminazione] = useState<string | null>(null);
  const [inCorso, iniziaTransizione] = useTransition();

  if (inModifica) {
    return (
      <tr className="border-t border-border bg-secondary/20">
        <td colSpan={4} className="px-4 py-4">
          <FormCatalogoSemplice
            categorieEsistenti={categorieEsistenti}
            rigaEsistente={riga}
            azioneCrea={azioneCrea}
            azioneAggiorna={azioneAggiorna}
            onCompletato={() => setInModifica(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <div className="font-medium">{riga.nome}</div>
        {riga.descrizione && (
          <div className="text-xs text-muted-foreground">{riga.descrizione}</div>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{riga.categoria}</td>
      <td className="px-4 py-3">
        <Badge variant={riga.attiva ? 'accent' : 'outline'}>
          {riga.attiva ? 'Attiva' : 'Disattivata'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setInModifica(true)}>
            Modifica
          </Button>
          <Button
            type="button"
            variant={riga.attiva ? 'outline' : 'accent'}
            size="sm"
            disabled={inCorso}
            onClick={() =>
              iniziaTransizione(async () => {
                await azioneImpostaAttiva(riga.id, !riga.attiva);
                router.refresh();
              })
            }
          >
            {riga.attiva ? 'Disattiva' : 'Riattiva'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={inCorso}
            onClick={() =>
              iniziaTransizione(async () => {
                setErroreEliminazione(null);
                const risultato = await azioneElimina(riga.id);
                if (!risultato.successo) {
                  setErroreEliminazione(risultato.errore ?? 'Impossibile eliminare.');
                } else {
                  router.refresh();
                }
              })
            }
          >
            Elimina
          </Button>
        </div>
        {erroreEliminazione && (
          <p className="mt-2 max-w-xs text-right text-xs text-destructive">{erroreEliminazione}</p>
        )}
      </td>
    </tr>
  );
}
