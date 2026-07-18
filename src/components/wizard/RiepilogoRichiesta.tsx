'use client';

import { Badge } from '@/components/ui/badge';
import { formattaDimensione } from '@/lib/utils';
import type { TipoProgettoConfigurazione } from '@/lib/tipo-progetto-schema';
import type { DocumentoRichiesta } from '@prisma/client';

interface Props {
  configurazione: TipoProgettoConfigurazione;
  datiForm: Record<string, unknown>;
  documenti: DocumentoRichiesta[];
}

/**
 * Il riepilogo è generato interamente dalla configurazione (etichette dei campi,
 * opzioni scelte) - non contiene alcuna riga specifica per "cucina" o "armadio".
 */
export function RiepilogoRichiesta({ configurazione, datiForm, documenti }: Props) {
  return (
    <div className="space-y-6">
      {configurazione.step.map((step) => {
        const campiValorizzati = step.campi.filter((c) => {
          const v = datiForm[c.chiave];
          return v !== undefined && v !== null && String(v).trim().length > 0;
        });
        if (campiValorizzati.length === 0) return null;

        return (
          <div key={step.chiave}>
            <h4 className="mb-2 text-sm font-medium text-muted-foreground">{step.titolo}</h4>
            <dl className="grid gap-2 sm:grid-cols-2">
              {campiValorizzati.map((campo) => {
                const valore = datiForm[campo.chiave];
                const opzioneScelta = campo.opzioni?.find((o) => o.valore === valore);
                return (
                  <div key={campo.chiave} className="rounded-md bg-secondary/40 px-3 py-2">
                    <dt className="text-xs text-muted-foreground">{campo.etichetta}</dt>
                    <dd className="text-sm">{opzioneScelta?.etichetta ?? String(valore)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
        );
      })}

      {documenti.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-medium text-muted-foreground">Documenti allegati</h4>
          <div className="flex flex-wrap gap-2">
            {documenti.map((d) => (
              <Badge key={d.id} variant="outline">
                {d.nomeFileOriginale} · {formattaDimensione(d.dimensioneByte)}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
