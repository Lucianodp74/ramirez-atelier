'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FormFinitura } from './FormFinitura';
import { impostaAttivaFinituraAzione, eliminaFinituraAzione } from '@/app/admin/azioni';

interface Finitura {
  id: string;
  categoria: string;
  nome: string;
  descrizione: string | null;
  coloreHex: string;
  texture: string;
  attiva: boolean;
  ordinamento: number;
}

export function RigaFinitura({
  finitura,
  categorieEsistenti,
}: {
  finitura: Finitura;
  categorieEsistenti: string[];
}) {
  const router = useRouter();
  const [inModifica, setInModifica] = useState(false);
  const [erroreEliminazione, setErroreEliminazione] = useState<string | null>(null);
  const [inCorso, iniziaTransizione] = useTransition();

  if (inModifica) {
    return (
      <tr className="border-t border-border bg-secondary/20">
        <td colSpan={4} className="px-4 py-4">
          <FormFinitura
            categorieEsistenti={categorieEsistenti}
            finituraEsistente={finitura}
            onCompletato={() => setInModifica(false)}
          />
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-t border-border">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <span
            className="h-8 w-8 shrink-0 rounded-md border border-border"
            style={{ backgroundColor: finitura.coloreHex }}
          />
          <div>
            <div className="font-medium">{finitura.nome}</div>
            {finitura.descrizione && (
              <div className="text-xs text-muted-foreground">{finitura.descrizione}</div>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-muted-foreground">{finitura.categoria}</td>
      <td className="px-4 py-3">
        <Badge variant={finitura.attiva ? 'accent' : 'outline'}>
          {finitura.attiva ? 'Attiva' : 'Disattivata'}
        </Badge>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setInModifica(true)}>
            Modifica
          </Button>
          <Button
            type="button"
            variant={finitura.attiva ? 'outline' : 'accent'}
            size="sm"
            disabled={inCorso}
            onClick={() =>
              iniziaTransizione(async () => {
                await impostaAttivaFinituraAzione(finitura.id, !finitura.attiva);
                router.refresh();
              })
            }
          >
            {finitura.attiva ? 'Disattiva' : 'Riattiva'}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={inCorso}
            onClick={() =>
              iniziaTransizione(async () => {
                setErroreEliminazione(null);
                const risultato = await eliminaFinituraAzione(finitura.id);
                if (!risultato.successo) {
                  setErroreEliminazione(risultato.errore ?? 'Impossibile eliminare la finitura.');
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
