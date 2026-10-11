import {
  ErroreAccessoNegato,
  ErroreNonAutenticato,
  richiediContesto,
} from '@/server/identity/contesto';

/**
 * Anteprima interna del Catalogo Librerie: i modelli in BOZZA sono visibili
 * solo a un utente autenticato con permesso di lettura sul catalogo.
 *
 * Solo i due esiti attesi (nessuna sessione valida, permesso mancante)
 * diventano `false`. Ogni altro errore viene rilanciato: in particolare il
 * segnale con cui Next.js interrompe il prerendering statico quando si legge
 * `cookies()`. Inghiottirlo permetterebbe di generare e mettere in cache la
 * vista pubblica, nascondendo per sempre le bozze anche a chi è autorizzato.
 * Le pagine che usano questa funzione dichiarano comunque
 * `dynamic = 'force-dynamic'`.
 */
export async function anteprimaInternaConsentita(): Promise<boolean> {
  try {
    await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
    return true;
  } catch (errore) {
    if (errore instanceof ErroreNonAutenticato || errore instanceof ErroreAccessoNegato) {
      return false;
    }
    throw errore;
  }
}
