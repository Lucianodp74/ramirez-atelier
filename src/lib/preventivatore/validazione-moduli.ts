import { validaModulo, type ModuloConfigurato } from '@/lib/preventivatore/moduli';

/**
 * Estratto verbatim da `src/app/preventivatore/azioni.ts` (nessun cambio di
 * comportamento) per essere riusabile anche fuori dalle server action del
 * Preventivatore — es. dal servizio dei Progetti Preimpostati, che deve
 * validare `moduli` con le stesse identiche regole, senza duplicarle.
 */
export const MAX_MODULI = 30;
export const MAX_INPUT_BYTES = 50_000;
export const MAX_ID_LENGTH = 80;

export function isModuloConfigurato(value: unknown): value is ModuloConfigurato {
  if (!value || typeof value !== 'object') return false;
  const m = value as Record<string, unknown>;
  return typeof m.id === 'string' && m.id.length > 0 && m.id.length <= MAX_ID_LENGTH
    && typeof m.tipo === 'string'
    && typeof m.larghezzaCm === 'number' && Number.isFinite(m.larghezzaCm)
    && typeof m.altezzaCm === 'number' && Number.isFinite(m.altezzaCm)
    && typeof m.profonditaCm === 'number' && Number.isFinite(m.profonditaCm)
    && typeof m.materiale === 'string'
    && typeof m.finitura === 'string'
    && typeof m.configurazione === 'string'
    && (m.ripiani === undefined || (typeof m.ripiani === 'number' && Number.isInteger(m.ripiani)));
}

export function validaInputModuli(input: unknown): asserts input is ModuloConfigurato[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error('Aggiungi almeno un modulo.');
  if (input.length > MAX_MODULI) throw new Error(`Il preventivo può contenere al massimo ${MAX_MODULI} moduli.`);
  const serialized = JSON.stringify(input);
  if (serialized.length > MAX_INPUT_BYTES) throw new Error('Configurazione troppo grande. Riduci il numero di moduli o le opzioni.');
  for (const [index, value] of input.entries()) {
    if (!isModuloConfigurato(value)) throw new Error(`Modulo ${index + 1} non valido.`);
    const errors = validaModulo(value);
    if (errors.length) throw new Error(`Modulo ${index + 1}: ${errors.join(' ')}`);
  }
}
