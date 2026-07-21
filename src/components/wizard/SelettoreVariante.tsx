'use client';

import { cn } from '@/lib/utils';
import type { VariantePreimpostata } from '@prisma/client';

interface Props {
  varianti: VariantePreimpostata[];
  selezionata: string | null;
  onSeleziona: (variante: VariantePreimpostata) => void;
}

/**
 * Non un componente "select" generico: la scelta dello stile di partenza non
 * è un campo del form (non vive in tipo-progetto-schema.ts), è una fase a sé
 * del wizard, orchestrata da ConfiguratoreWizard - mostrata solo se esistono
 * varianti attive per questo tipo di progetto. Nessun pulsante "parti da
 * zero": il pulsante "Avanti" già esistente nel wizard basta - non scegliere
 * nessuna card è già una scelta valida, non serve un secondo modo di dirlo.
 */
export function SelettoreVariante({ varianti, selezionata, onSeleziona }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Parti da uno stile già pensato per te, o prosegui senza sceglierne uno — potrai comunque
        cambiare ogni scelta più avanti.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {varianti.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => onSeleziona(v)}
            className={cn(
              'rounded-lg border p-4 text-left transition-colors',
              selezionata === v.id
                ? 'border-accent bg-accent/10'
                : 'border-input hover:border-muted-foreground',
            )}
          >
            <div className="font-medium">{v.nome}</div>
            {v.descrizione && (
              <div className="mt-1 text-sm text-muted-foreground">{v.descrizione}</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
