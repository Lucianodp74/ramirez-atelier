'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { SelezionatoreFinitura } from './SelezionatoreFinitura';
import type { CampoConfigurazione } from '@/lib/tipo-progetto-schema';

interface Props {
  campo: CampoConfigurazione;
  valore: unknown;
  errore?: string;
  onChange: (chiave: string, valore: unknown) => void;
}

/**
 * Questo componente non ha alcuna conoscenza del dominio (non sa cosa sia una
 * "cucina" o un "armadio"): riceve un CampoConfigurazione e sa solo interpretarne
 * il `tipo`. È l'unico punto del codice in cui esiste uno switch sui tipi di campo -
 * aggiungere un nuovo TipoCampo richiede di toccare solo questo file, mai i wizard
 * o le pagine che lo usano.
 */
export function CampoRenderer({ campo, valore, errore, onChange }: Props) {
  const idCampo = `campo-${campo.chiave}`;

  return (
    <div className="space-y-2">
      <Label htmlFor={idCampo}>
        {campo.etichetta}
        {campo.obbligatorio && <span className="ml-1 text-accent">*</span>}
      </Label>

      {(campo.tipo === 'testo' || campo.tipo === 'numero' || campo.tipo === 'data') && (
        <Input
          id={idCampo}
          type={campo.tipo === 'numero' ? 'number' : campo.tipo === 'data' ? 'date' : 'text'}
          placeholder={campo.placeholder}
          value={(valore as string | number | undefined) ?? ''}
          erroneo={!!errore}
          onChange={(e) => onChange(campo.chiave, e.target.value)}
        />
      )}

      {campo.tipo === 'testo_lungo' && (
        <Textarea
          id={idCampo}
          placeholder={campo.placeholder}
          value={(valore as string | undefined) ?? ''}
          erroneo={!!errore}
          onChange={(e) => onChange(campo.chiave, e.target.value)}
        />
      )}

      {campo.tipo === 'select' && campo.opzioni && (
        <div className="grid gap-2 sm:grid-cols-2">
          {campo.opzioni.map((opzione) => (
            <button
              key={opzione.valore}
              type="button"
              onClick={() => onChange(campo.chiave, opzione.valore)}
              className={cn(
                'rounded-md border px-4 py-3 text-left text-sm transition-colors hover:border-accent',
                valore === opzione.valore
                  ? 'border-accent bg-accent/10'
                  : 'border-input bg-secondary/40',
              )}
            >
              <div className="font-medium">{opzione.etichetta}</div>
              {opzione.descrizione && (
                <div className="mt-0.5 text-xs text-muted-foreground">{opzione.descrizione}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {campo.tipo === 'select_immagine' &&
        campo.opzioni &&
        campo.opzioni.some((o) => o.coloreHex) && (
          <SelezionatoreFinitura
            opzioni={campo.opzioni}
            valore={valore}
            onSeleziona={(v) => onChange(campo.chiave, v)}
          />
        )}

      {campo.tipo === 'select_immagine' &&
        campo.opzioni &&
        !campo.opzioni.some((o) => o.coloreHex) && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {campo.opzioni.map((opzione) => (
              <button
                key={opzione.valore}
                type="button"
                onClick={() => onChange(campo.chiave, opzione.valore)}
                className={cn(
                  'group overflow-hidden rounded-lg border text-left transition-colors',
                  valore === opzione.valore
                    ? 'border-accent'
                    : 'border-input hover:border-muted-foreground',
                )}
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-secondary/60 text-xs text-muted-foreground">
                  {/* Immagini reali non ancora in scope (storage documenti in pausa): placeholder testuale. */}
                  <span>{opzione.etichetta}</span>
                </div>
                <div className="p-3">
                  <div className="text-sm font-medium">{opzione.etichetta}</div>
                  {opzione.descrizione && (
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {opzione.descrizione}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

      {campo.aiutoTesto && <p className="text-xs text-muted-foreground">{campo.aiutoTesto}</p>}
      {errore && <p className="text-xs text-destructive">{errore}</p>}
    </div>
  );
}
