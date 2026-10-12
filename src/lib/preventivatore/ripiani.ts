import type { ModuloConfigurato } from './moduli';

/**
 * Ripiani realmente considerati per un modulo. Quando il valore non è
 * indicato vale la stessa regola del motore prezzi (`calcolaCostoModulo`):
 * 2 per un modulo aperto, 1 negli altri casi - mai zero per assenza.
 *
 * Il motore non usa questa funzione (resta invariato): un test verifica che
 * le due regole restino allineate per ogni tipo e configurazione di modulo.
 */
export function ripianiEffettivi(
  modulo: Pick<ModuloConfigurato, 'ripiani' | 'configurazione'>,
): number {
  return modulo.ripiani ?? (modulo.configurazione === 'APERTO' ? 2 : 1);
}
