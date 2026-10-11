import { richiediContesto } from '@/server/identity/contesto';

/**
 * Anteprima interna del Catalogo Librerie: i modelli in BOZZA sono visibili
 * solo a un utente autenticato con permesso di lettura sul catalogo. Per
 * chiunque altro (nessuna sessione, sessione scaduta, permesso mancante) la
 * risposta è semplicemente `false`: la pagina pubblica si comporta come se
 * la bozza non esistesse.
 */
export async function anteprimaInternaConsentita(): Promise<boolean> {
  try {
    await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
    return true;
  } catch {
    return false;
  }
}
