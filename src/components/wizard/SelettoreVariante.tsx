'use client';

import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { VariantePreimpostata } from '@prisma/client';

interface Props {
  varianti: VariantePreimpostata[];
  selezionata: string | null;
  onSeleziona: (variante: VariantePreimpostata) => void;
}

export function SelettoreVariante({ varianti, selezionata, onSeleziona }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-background p-4">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Scegli un punto di partenza se vuoi. Potrai modificare ogni dettaglio nei passaggi
          successivi, quindi non serve avere già tutto deciso.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {varianti.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSeleziona(v)}
            aria-pressed={selezionata === v.id}
            className={cn(
              'relative min-h-32 rounded-xl border p-5 text-left transition-all duration-200',
              selezionata === v.id
                ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary'
                : 'border-border bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm',
            )}
          >
            {selezionata === v.id && (
              <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3.5 w-3.5" strokeWidth={3} />
              </span>
            )}
            <div className="pr-8 font-medium">{v.nome}</div>
            {v.descrizione && (
              <div className="mt-2 pr-8 text-sm leading-relaxed text-muted-foreground">{v.descrizione}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
