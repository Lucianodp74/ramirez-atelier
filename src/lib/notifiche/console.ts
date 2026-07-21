import type { InvioEmailAdapter } from './tipi';

/**
 * Adattatore di sviluppo: non invia nulla per davvero, scrive nel log del
 * server - permette di verificare l'intero flusso (token generato, link
 * costruito, contenuto del messaggio) senza credenziali di un provider
 * reale, esattamente come l'adattatore locale dello storage documenti.
 */
export class ConsoleEmailAdapter implements InvioEmailAdapter {
  async invia(params: { destinatario: string; oggetto: string; corpo: string }): Promise<void> {
    console.log('\n─── Email (adattatore console, nessun invio reale) ───');
    console.log('A:', params.destinatario);
    console.log('Oggetto:', params.oggetto);
    console.log(params.corpo);
    console.log('───────────────────────────────────────────────────\n');
  }
}
