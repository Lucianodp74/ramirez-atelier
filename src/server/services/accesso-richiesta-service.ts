import { timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db } from '@/server/db';

/** Cookie di ripresa del wizard: uno per tipo di progetto, contiene il token della bozza. */
export const PREFISSO_COOKIE_BOZZA = 'ra_bozza_';

/**
 * Stesso messaggio per ogni rifiuto (id inesistente, richiesta di un altro
 * cliente, cookie assente o non valido): chi prova un id a caso non deve
 * poter distinguere una richiesta che esiste da una che non esiste.
 */
export class ErroreRichiestaNonAccessibile extends Error {
  constructor() {
    super('Richiesta non trovata.');
    this.name = 'ErroreRichiestaNonAccessibile';
  }
}

function stessoToken(ricevuto: string | undefined, atteso: string): boolean {
  if (!ricevuto || !atteso) return false;
  const a = Buffer.from(ricevuto);
  const b = Buffer.from(atteso);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Carica una richiesta SOLO se appartiene a chi sta chiamando.
 *
 * L'id di una richiesta non è una credenziale: compare negli URL e nelle
 * risposte. La prova di appartenenza è il token di ripresa, che il server ha
 * consegnato a quel browser in un cookie httpOnly quando ha creato o ripreso
 * la bozza (`iniziaORecuperaBozza`). Il controllo avviene interamente qui,
 * lato server: nessuna azione pubblica deve leggere o scrivere una richiesta
 * partendo dal solo id.
 */
export async function richiestaDelCliente(richiestaId: unknown) {
  if (typeof richiestaId !== 'string' || richiestaId.length === 0 || richiestaId.length > 64) {
    throw new ErroreRichiestaNonAccessibile();
  }

  const richiesta = await db.richiestaProgetto.findUnique({
    where: { id: richiestaId },
    include: { tipoProgetto: true },
  });
  if (!richiesta || !richiesta.tipoProgetto) throw new ErroreRichiestaNonAccessibile();

  const cookieStore = await cookies();
  const token = cookieStore.get(PREFISSO_COOKIE_BOZZA + richiesta.tipoProgetto.chiave)?.value;
  if (!stessoToken(token, richiesta.tokenRipresa)) throw new ErroreRichiestaNonAccessibile();

  return richiesta;
}
