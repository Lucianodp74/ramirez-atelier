'use client';

import { useEffect, useState } from 'react';
import { iniziaORecuperaBozza } from '@/app/progetti/[chiave]/azioni';
import { TipoProgettoConfigurazioneSchema } from '@/lib/tipo-progetto-schema';
import { ConfiguratoreWizard } from './ConfiguratoreWizard';
import type {
  RichiestaProgetto,
  DocumentoRichiesta,
  TipoProgetto,
  VariantePreimpostata,
} from '@prisma/client';

interface Props {
  chiaveTipoProgetto: string;
  /** Token esplicito da un link generato dall'admin (es. "usa come punto di
   * partenza") - ha priorità sul cookie del browser, che potrebbe non esserci
   * affatto se ad aprire il link è una persona diversa da chi ha creato la bozza. */
  tokenEsplicito?: string;
}

/**
 * La creazione/ripresa della bozza richiede di poter scrivere un cookie, operazione
 * permessa da Next.js solo dentro una Server Action (non durante il render di una
 * pagina server) - per questo l'avvio avviene qui, lato client, al primo montaggio,
 * invece che direttamente nella pagina.
 */
export function WizardBootstrap({ chiaveTipoProgetto, tokenEsplicito }: Props) {
  const [stato, setStato] = useState<
    | { fase: 'caricamento' }
    | { fase: 'errore'; messaggio: string }
    | {
        fase: 'pronto';
        tipoProgetto: TipoProgetto;
        richiesta: RichiestaProgetto;
        documenti: DocumentoRichiesta[];
        varianti: VariantePreimpostata[];
      }
  >({ fase: 'caricamento' });

  useEffect(() => {
    let annullato = false;
    iniziaORecuperaBozza(chiaveTipoProgetto, tokenEsplicito)
      .then(({ richiesta, tipoProgetto, varianti }) => {
        if (annullato) return;
        setStato({
          fase: 'pronto',
          tipoProgetto,
          richiesta,
          documenti: richiesta.documenti ?? [],
          varianti,
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
  }, [chiaveTipoProgetto, tokenEsplicito]);

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
      variantiDisponibili={stato.varianti}
    />
  );
}
