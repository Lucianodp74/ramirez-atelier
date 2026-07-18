import { db } from '@/server/db';
import { costruisciFattiRichiesta } from '@/lib/richiesta-fatti';
import { eseguiRegolePerContesto } from '@/lib/rule-engine/motore';
import { assicuraGestoriRegistrati } from '@/lib/rule-engine/bootstrap';

export const CONTESTO_PRICING = 'preventivo_pricing';

/**
 * Valuta la fascia di prezzo di una richiesta tramite il Rule Engine. Questo
 * servizio non calcola nulla da sé: costruisce i fatti (dati grezzi) e li
 * consegna al motore, che decide quale Regola (dati, non codice) si applica.
 * Se nessuna Regola attiva ha condizione vera, la richiesta resta senza
 * fasciaPrezzoMin/Max - mostrato onestamente come "non ancora disponibile"
 * nella UI, mai un prezzo inventato.
 */
export async function valutaPrezzo(tenantId: string, richiestaId: string) {
  const richiesta = await db.richiestaProgetto.findUnique({
    where: { id: richiestaId },
    include: { tipoProgetto: true, fasciaBudget: true },
  });
  if (!richiesta || richiesta.tenantId !== tenantId) {
    throw new Error('Richiesta non trovata.');
  }
  if (!richiesta.tipoProgetto) {
    throw new Error('Tipo di progetto non caricato correttamente.');
  }

  assicuraGestoriRegistrati();

  const fatti = costruisciFattiRichiesta(
    richiesta,
    richiesta.tipoProgetto,
    richiesta.fasciaBudget ?? null,
  );

  return eseguiRegolePerContesto(
    tenantId,
    CONTESTO_PRICING,
    'richiesta_progetto',
    richiestaId,
    fatti,
    { fermaAlPrimoMatch: true },
  );
}
