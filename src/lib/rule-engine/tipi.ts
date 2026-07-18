import { z } from 'zod';

/**
 * Business Rules Engine generico (ADR-0003). Questo file non contiene alcun
 * riferimento a "richiesta", "budget", "cucina" o qualunque altro concetto di
 * dominio: definisce solo la FORMA di una condizione e di un'azione, riusabile
 * per pricing, workflow, automazioni, validazioni, CRM, notifiche, AI,
 * autorizzazioni, Business Intelligence - come richiesto.
 */

export const OperatoreCondizioneSchema = z.enum([
  'uguale',
  'diverso',
  'maggiore',
  'maggiore_uguale',
  'minore',
  'minore_uguale',
  'contiene',
  'in',
  'non_in',
  'tra',
  'vuoto',
  'non_vuoto',
]);
export type OperatoreCondizione = z.infer<typeof OperatoreCondizioneSchema>;

/** Nodo foglia: confronta un campo dei "fatti" con un valore, secondo un operatore. */
export const NodoFogliaSchema = z.object({
  campo: z.string(),
  operatore: OperatoreCondizioneSchema,
  valore: z.unknown().optional(), // assente per 'vuoto'/'non_vuoto'
});
export type NodoFoglia = z.infer<typeof NodoFogliaSchema>;

/**
 * Albero di condizioni componibile con E/O/NON (Requisito esplicito). Uno schema
 * ricorsivo: Zod richiede `z.lazy` per questo, con un tipo esplicito perché
 * l'inferenza automatica non gestisce la ricorsione.
 */
export type NodoCondizione =
  | { operatoreLogico: 'E'; figli: NodoCondizione[] }
  | { operatoreLogico: 'O'; figli: NodoCondizione[] }
  | { operatoreLogico: 'NON'; figlio: NodoCondizione }
  | NodoFoglia;

export const NodoCondizioneSchema: z.ZodType<NodoCondizione> = z.lazy(() =>
  z.union([
    z.object({ operatoreLogico: z.literal('E'), figli: z.array(NodoCondizioneSchema) }),
    z.object({ operatoreLogico: z.literal('O'), figli: z.array(NodoCondizioneSchema) }),
    z.object({ operatoreLogico: z.literal('NON'), figlio: NodoCondizioneSchema }),
    NodoFogliaSchema,
  ]),
);

/**
 * Un'azione è un tipo (stringa libera, come `Regola.contesto`) più parametri
 * arbitrari. Il motore non conosce il significato di nessuna azione: si limita a
 * cercarla nel registro (v. registro-azioni.ts) e invocarla.
 */
export const AzioneSchema = z.object({
  tipo: z.string(),
  parametri: z.record(z.string(), z.unknown()).default({}),
});
export type Azione = z.infer<typeof AzioneSchema>;

export const ElencoAzioniSchema = z.array(AzioneSchema);

/** I "fatti" su cui una regola viene valutata: un oggetto piatto, chiavi con provenienza esplicita nel nome. */
export type Fatti = Record<string, unknown>;

export interface ContestoEsecuzione {
  entitaTipo: string;
  entitaId: string;
  regolaId: string;
}
