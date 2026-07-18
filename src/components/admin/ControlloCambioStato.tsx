'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { StatoBadge } from './StatoBadge';
import { prossimiStatiPossibili, ETICHETTA_STATO } from '@/lib/workflow';
import { cambiaStatoRichiesta } from '@/app/admin/azioni';
import type { StatoRichiesta } from '@prisma/client';

interface Props {
  richiestaId: string;
  statoCorrente: StatoRichiesta;
}

export function ControlloCambioStato({ richiestaId, statoCorrente }: Props) {
  const router = useRouter();
  const [inCorso, iniziaTransizione] = useTransition();
  const [errore, setErrore] = useState<string | null>(null);
  const prossimi = prossimiStatiPossibili(statoCorrente);

  function applica(nuovoStato: StatoRichiesta) {
    setErrore(null);
    iniziaTransizione(async () => {
      const esito = await cambiaStatoRichiesta(richiestaId, nuovoStato);
      if (!esito.successo) {
        setErrore(esito.errore);
        return;
      }
      router.refresh();
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
      {errore && <p className="text-sm text-destructive">{errore}</p>}
    </div>
  );
}
