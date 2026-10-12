import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';
import { MODELLI_LIBRERIE, type ModelloLibreria } from '@/lib/catalogo-librerie/catalogo';
import {
  richiedeAnteprimaInterna,
  risolviModelloOrigine,
  type ModelloOrigine,
} from '@/lib/catalogo-librerie/modello-origine';
import { anteprimaInternaConsentita } from '@/server/services/catalogo-librerie-accesso';

/**
 * Modello d'origine da salvare con una richiesta del Preventivatore.
 *
 * Non lancia mai: il modello d'origine è un dato descrittivo e non deve far
 * perdere una richiesta valida del cliente. In caso di dubbio il risultato è
 * sempre il più prudente (fail-closed):
 *  - il permesso di anteprima viene verificato solo quando serve, cioè per un
 *    modello in bozza; un modello pubblicabile non dipende da quel controllo;
 *  - se la verifica del permesso fallisce per un errore imprevisto, la bozza
 *    è trattata come non autorizzata e non viene registrata;
 *  - qualunque altro errore produce una richiesta senza modello d'origine.
 */
export async function modelloOriginePerRichiesta(
  codice: unknown,
  moduli: ModuloConfigurato[],
  catalogo: readonly ModelloLibreria[] = MODELLI_LIBRERIE,
): Promise<ModelloOrigine | null> {
  try {
    let anteprimaInterna = false;
    if (richiedeAnteprimaInterna(codice, catalogo)) {
      try {
        // Solo un `true` esplicito autorizza la bozza.
        anteprimaInterna = (await anteprimaInternaConsentita()) === true;
      } catch (errore) {
        console.error(
          "Modello d'origine: verifica del permesso di anteprima non riuscita, bozza ignorata.",
          errore instanceof Error ? errore.message : errore,
        );
      }
    }
    return risolviModelloOrigine(codice, moduli, { anteprimaInterna }, catalogo);
  } catch (errore) {
    console.error(
      "Modello d'origine: convalida non riuscita, richiesta salvata senza il campo.",
      errore instanceof Error ? errore.message : errore,
    );
    return null;
  }
}
