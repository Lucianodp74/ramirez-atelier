'use client';

import { useEffect, useState } from 'react';
import { iniziaORecuperaBozza } from '@/app/progetti/[chiave]/azioni';
import { TipoProgettoConfigurazioneSchema } from '@/lib/tipo-progetto-schema';
import { ConfiguratoreWizard } from './ConfiguratoreWizard';
import type { RichiestaProgetto, DocumentoRichiesta, TipoProgetto } from '@prisma/client';

interface Props {
  chiaveTipoProgetto: string;
}

/**
 * La creazione/ripresa della bozza richiede di poter scrivere un cookie, operazione
 * permessa da Next.js solo dentro una Server Action (non durante il render di una
 * pagina server) - per questo l'avvio avviene qui, lato client, al primo montaggio,
 * invece che direttamente nella pagina.
 */
export function WizardBootstrap({ chiaveTipoProgetto }: Props) {
  const [stato, setStato] = useState<
    | { fase: 'caricamento' }
    | { fase: 'errore'; messaggio: string }
    | {
        fase: 'pronto';
        tipoProgetto: TipoProgetto;
        richiesta: RichiestaProgetto;
        documenti: DocumentoRichiesta[];
      }
  >({ fase: 'caricamento' });

  useEffect(() => {
    let annullato = false;
    iniziaORecuperaBozza(chiaveTipoProgetto)
      .then(({ richiesta, tipoProgetto }) => {
        if (annullato) return;
        setStato({
          fase: 'pronto',
          tipoProgetto,
          richiesta,
          documenti: richiesta.documenti ?? [],
        });
      })
      .catch((e) => {
        if (annullato) return;
        setStato({
          fase: 'errore',
          messaggio: e instanceof Error ? e.message : 'Impossibile avviare il configuratore.',
        });
      });
    return () => {
      annullato = true;
    };
  }, [chiaveTipoProgetto]);

  if (stato.fase === 'caricamento') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Preparazione del tuo percorso guidato…
      </div>
    );
  }

  if (stato.fase === 'errore') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-destructive">
        {stato.messaggio}
      </div>
    );
  }

  const configurazione = TipoProgettoConfigurazioneSchema.parse(stato.tipoProgetto.configurazione);

  return (
    <ConfiguratoreWizard
      chiaveTipoProgetto={chiaveTipoProgetto}
      nomeTipoProgetto={stato.tipoProgetto.nome}
      configurazione={configurazione}
      richiestaIniziale={stato.richiesta}
      documentiIniziali={stato.documenti}
    />
  );
}
