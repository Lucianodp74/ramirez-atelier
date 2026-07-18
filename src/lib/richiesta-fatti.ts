import { TipoProgettoConfigurazioneSchema } from '@/lib/tipo-progetto-schema';
import type { RichiestaProgetto, TipoProgetto, FasciaBudget } from '@prisma/client';
import type { Fatti } from './rule-engine/tipi';

/**
 * Fonde le colonne "riservate" e il JSON libero in un'unica vista piatta -
 * stessa struttura usata dal wizard (src/app/progetti/[chiave]/azioni.ts) per
 * validazione/completezza, ora condivisa anche dal Rule Engine per non
 * duplicare la logica di merge in due punti (era così prima di questo
 * incremento: un piccolo debito già segnalabile, risolto qui).
 */
export function datiFormPiatti(richiesta: RichiestaProgetto): Record<string, unknown> {
  const jsonEsistente = (richiesta.datiFormJson as Record<string, unknown>) ?? {};
  return {
    ...jsonEsistente,
    clienteNome: richiesta.clienteNome,
    clienteEmail: richiesta.clienteEmail,
    clienteTelefono: richiesta.clienteTelefono,
    clienteTipo: richiesta.clienteTipo,
    clienteAzienda: richiesta.clienteAzienda,
    budgetDichiarato: richiesta.budgetDichiarato,
    dataDesiderata: richiesta.dataDesiderata
      ? new Date(richiesta.dataDesiderata).toISOString().slice(0, 10)
      : null,
    messaggioLibero: richiesta.messaggioLibero,
  };
}

/**
 * Costruisce i fatti valutabili dal Rule Engine per una richiesta, per
 * qualunque contesto (oggi: "richiesta_priorita_commerciale",
 * "preventivo_pricing"). Principio chiave (richiesto esplicitamente per il
 * Motore di Pricing): nessun bucketing/formula qui dentro - i valori esposti
 * sono sempre grezzi (il numero di centimetri, il nome del materiale scelto),
 * mai una categoria "piccola/media/grande" pre-calcolata. Sono le condizioni
 * delle singole Regole (operatori "tra", "maggiore_uguale", ...) a decidere
 * quali intervalli contano - la logica economica resta tutta nei dati.
 *
 * I campi specifici del tipo di progetto (dimensioni, materiale, ...) vengono
 * esposti solo se la loro configurazione dichiara `chiavePricing` (v.
 * tipo-progetto-schema.ts) - un campo che non serve a nessuna valutazione
 * economica non deve inquinare i fatti disponibili.
 */
export function costruisciFattiRichiesta(
  richiesta: RichiestaProgetto,
  tipoProgetto: TipoProgetto,
  fasciaBudget: FasciaBudget | null,
): Fatti {
  const datiForm = datiFormPiatti(richiesta);
  const configurazione = TipoProgettoConfigurazioneSchema.parse(tipoProgetto.configurazione);

  const fatti: Fatti = {
    'richiesta.indiceCompletezza': richiesta.indiceCompletezza,
    'richiesta.clienteTipo': richiesta.clienteTipo,
    'richiesta.tipoProgettoChiave': tipoProgetto.chiave,
    'richiesta.fasciaBudgetOrdinamento': fasciaBudget?.ordinamento ?? null,
    'richiesta.fasciaBudgetNome': fasciaBudget?.nome ?? null,
  };

  for (const step of configurazione.step) {
    for (const campo of step.campi) {
      if (!campo.chiavePricing) continue;
      fatti[`richiesta.${campo.chiavePricing}`] = datiForm[campo.chiave] ?? null;
    }
  }

  return fatti;
}
