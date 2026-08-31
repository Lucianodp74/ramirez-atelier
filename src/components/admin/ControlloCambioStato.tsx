'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatoBadge } from './StatoBadge';
import { prossimiStatiPossibili, ETICHETTA_STATO } from '@/lib/workflow';
import { cambiaStatoRichiesta } from '@/app/admin/azioni';
import { creaCommessaDaRichiestaAzione } from '@/app/admin/commesse-azioni';
import type { StatoRichiesta } from '@prisma/client';

interface Props {
  richiestaId: string;
  statoCorrente: StatoRichiesta;
}

export function ControlloCambioStato({ richiestaId, statoCorrente }: Props) {
  const router = useRouter();
  const [inCorso, iniziaTransizione] = useTransition();
  const [errore, setErrore] = useState<string | null>(null);
  const [successo, setSuccesso] = useState<string | null>(null);
  const prossimi = prossimiStatiPossibili(statoCorrente);

  function applica(nuovoStato: StatoRichiesta) {
    setErrore(null);
    setSuccesso(null);
    iniziaTransizione(async () => {
      const esito = await cambiaStatoRichiesta(richiestaId, nuovoStato);
      if (!esito.successo) {
        setErrore(esito.errore);
        return;
      }
      router.refresh();
    });
  }

  function creaCommessa() {
    setErrore(null);
    setSuccesso(null);
    iniziaTransizione(async () => {
      try {
        const esito = await creaCommessaDaRichiestaAzione(richiestaId);
        if (!esito.successo) {
          setErrore(esito.errore);
          return;
        }
        setSuccesso('Commessa creata.');
        // La mutation è conclusa; navighiamo con una navigazione browser completa
        // per evitare un secondo render RSC della pagina richiesta.
        window.location.assign('/admin/commesse');
      } catch (error) {
        setErrore(error instanceof Error ? error.message : 'Impossibile creare la commessa.');
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Stato attuale:</span>
        <StatoBadge stato={statoCorrente} />
      </div>
      {prossimi.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {prossimi.map((stato) => (
            <Button
              key={stato}
              type="button"
              variant={stato === 'CHIUSA' ? 'outline' : 'accent'}
              size="sm"
              disabled={inCorso}
              onClick={() => applica(stato)}
            >
              → {ETICHETTA_STATO[stato]}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Nessuna transizione ulteriore disponibile.</p>
      )}
      {statoCorrente === 'CONVERTITA' && (
        <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
          <p className="text-sm font-medium">Preventivo accettato: crea la commessa operativa.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Se esiste una BOM, deve essere già confermata. Le righe vengono copiate come snapshot di produzione.
          </p>
          <Button
            type="button"
            variant="accent"
            size="sm"
            className="mt-3"
            disabled={inCorso || Boolean(successo)}
            onClick={creaCommessa}
          >
            {successo ? 'Commessa creata' : 'Crea commessa'}
          </Button>
        </div>
      )}
      {successo && <p className="text-sm text-emerald-700">{successo}</p>}
      {errore && <p className="text-sm text-destructive">{errore}</p>}
    </div>
  );
}
