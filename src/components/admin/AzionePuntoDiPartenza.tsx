'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { usaComePuntoDiPartenzaAzione } from '@/app/admin/azioni';

export function AzionePuntoDiPartenza({ richiestaId }: { richiestaId: string }) {
  const [link, setLink] = useState<string | null>(null);
  const [inCorso, iniziaTransizione] = useTransition();

  if (link) {
    return (
      <div className="rounded-md border border-accent/40 bg-accent/10 p-3 text-sm">
        <p className="mb-1 font-medium">Nuova bozza creata.</p>
        <p className="mb-2 text-muted-foreground">
          Apri questo link per completare i dati del nuovo cliente — le scelte tecniche (materiale,
          dimensioni, ferramenta) sono già precompilate.
        </p>
        <a href={link} target="_blank" rel="noreferrer" className="break-all text-accent underline">
          {link}
        </a>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={inCorso}
      onClick={() =>
        iniziaTransizione(async () => {
          const risultato = await usaComePuntoDiPartenzaAzione(richiestaId);
          setLink(
            `${window.location.origin}/progetti/${risultato.chiaveTipoProgetto}?bozza=${risultato.tokenRipresa}`,
          );
        })
      }
    >
      {inCorso ? 'Creazione…' : 'Usa come punto di partenza per una nuova richiesta'}
    </Button>
  );
}
