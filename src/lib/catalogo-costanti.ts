/**
 * Costanti del Catalogo Tecnico condivise tra client e server. Questo file
 * NON deve mai importare `@/server/db` o altro codice server-only: un
 * componente client (es. FormFinitura.tsx) deve poter importare da qui senza
 * trascinare `pg` nel bundle del browser.
 */

/** Le uniche texture che il selettore visivo del wizard sa davvero rendere
 * (v. SelezionatoreFinitura.tsx) - un elenco fisso qui ha senso perché è
 * legato 1:1 al codice di rendering, non al dominio (a differenza della
 * categoria, che resta libera). */
export const TEXTURE_DISPONIBILI = [
  { valore: 'legno', etichetta: 'Legno (venature)' },
  { valore: 'liscio', etichetta: 'Liscio (laccato, laminato)' },
  { valore: 'pietra', etichetta: 'Pietra (screziato)' },
  { valore: 'metallo', etichetta: 'Metallo (satinato)' },
  { valore: 'tessuto', etichetta: 'Tessuto (trama)' },
] as const;
