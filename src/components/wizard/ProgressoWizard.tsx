'use client';

import { Progress } from '@/components/ui/progress';
import {
  livelloCompletezza,
  ETICHETTA_LIVELLO_COMPLETEZZA,
  type StepMancante,
} from '@/lib/tipo-progetto-schema';

interface Props {
  percentuale: number;
  stepMancanti: StepMancante[];
}

export function ProgressoWizard({ percentuale, stepMancanti }: Props) {
  const livello = livelloCompletezza(percentuale);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{ETICHETTA_LIVELLO_COMPLETEZZA[livello]}</span>
        <span className="text-muted-foreground">{percentuale}%</span>
      </div>
      <Progress value={percentuale} />
      {stepMancanti.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Per completare il quadro: {stepMancanti.map((s) => s.titolo.toLowerCase()).join(', ')}.
        </p>
      )}
    </div>
  );
}
