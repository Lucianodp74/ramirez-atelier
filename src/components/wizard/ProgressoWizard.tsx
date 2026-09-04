'use client';

import { Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  livelloCompletezza,
  ETICHETTA_LIVELLO_COMPLETEZZA,
  type StepMancante,
} from '@/lib/tipo-progetto-schema';

interface Props {
  percentuale: number;
  stepMancanti: StepMancante[];
  faseCorrente: number;
  totaleFasi: number;
}

export function ProgressoWizard({ percentuale, stepMancanti, faseCorrente, totaleFasi }: Props) {
  const livello = livelloCompletezza(percentuale);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium">{ETICHETTA_LIVELLO_COMPLETEZZA[livello]}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Passaggio {faseCorrente + 1} di {totaleFasi}
          </p>
        </div>
        <span className="text-sm font-medium tabular-nums">{percentuale}%</span>
      </div>

      <Progress value={percentuale} />

      <div className="flex gap-1.5" aria-label={`Passaggio ${faseCorrente + 1} di ${totaleFasi}`}>
        {Array.from({ length: totaleFasi }).map((_, indice) => {
          const completato = indice < faseCorrente;
          const attivo = indice === faseCorrente;
          return (
            <div
              key={indice}
              className={
                attivo
                  ? 'h-1.5 flex-1 rounded-full bg-primary'
                  : completato
                    ? 'h-1.5 flex-1 rounded-full bg-primary/55'
                    : 'h-1.5 flex-1 rounded-full bg-muted'
              }
            />
          );
        })}
      </div>

      {stepMancanti.length > 0 && (
        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-60" />
          <span>Il riepilogo finale verrà completato con: {stepMancanti.map((s) => s.titolo.toLowerCase()).join(', ')}.</span>
        </p>
      )}
    </div>
  );
}
