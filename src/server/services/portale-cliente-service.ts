import { db } from '@/server/db';

/**
 * Etichette pensate per il cliente, distinte da quelle interne (src/lib/
 * workflow.ts: ETICHETTA_STATO) - un cliente non deve leggere gergo operativo
 * come "In revisione", ma un messaggio comprensibile sul proprio progetto.
 */
const MESSAGGIO_STATO_CLIENTE: Record<string, string> = {
  BOZZA: 'La tua richiesta non è ancora stata inviata.',
  NUOVA: 'Richiesta ricevuta: la stiamo esaminando.',
  IN_REVISIONE: 'Il nostro team sta lavorando sul tuo progetto.',
  PREVENTIVO_INVIATO: 'Il preventivo è pronto.',
  CONVERTITA: 'Progetto confermato: iniziamo a lavorarci!',
  CHIUSA: 'Questa richiesta è stata chiusa. Contattaci per saperne di più.',
};

export interface StatoRichiestaCliente {
  trovata: boolean;
  inviata: boolean;
  clienteNome: string | null;
  tipoProgettoNome: string;
  stato: string;
  messaggio: string;
  fasciaPrezzoMin: number | null;
  fasciaPrezzoMax: number | null;
  creataIl: Date;
}

/**
 * Punto di ingresso dell'esperimento (Roadmap ArtigianOS, Incremento 9): un
 * link di sola consultazione, portatore del token opaco già esistente
 * (tokenRipresa, Incremento 2) - nessuna nuova identità, nessun login, nessuna
 * tabella nuova. Compromesso di sicurezza dichiarato esplicitamente: un link
 * "bearer" può finire in una cronologia browser condivisa o in log - accettabile
 * qui perché la pagina è di sola lettura (nessuna azione possibile) e non
 * espone nulla oltre allo stato del proprio stesso progetto.
 *
 * Ogni consultazione genera un EventoAttivita (STATO_CONSULTATO_DAL_CLIENTE),
 * già visibile nella timeline esistente in /admin/richieste/[id] - è la misura
 * di apprendimento richiesta, senza costruire alcuna nuova interfaccia di
 * osservazione dedicata.
 */
export async function recuperaStatoPerCliente(
  tokenRipresa: string,
): Promise<StatoRichiestaCliente | null> {
  const richiesta = await db.richiestaProgetto.findUnique({
    where: { tokenRipresa },
    include: { tipoProgetto: true },
  });
  if (!richiesta || !richiesta.tipoProgetto) return null;

  const inviata = richiesta.stato !== 'BOZZA';

  if (inviata) {
    await db.eventoAttivita.create({
      data: {
        richiestaId: richiesta.id,
        tipo: 'STATO_CONSULTATO_DAL_CLIENTE',
        descrizione: 'Il cliente ha consultato lo stato della richiesta',
        attore: 'CLIENTE',
      },
    });
  }

  return {
    trovata: true,
    inviata,
    clienteNome: richiesta.clienteNome,
    tipoProgettoNome: richiesta.tipoProgetto.nome,
    stato: richiesta.stato,
    messaggio: MESSAGGIO_STATO_CLIENTE[richiesta.stato] ?? 'Stato non disponibile.',
    fasciaPrezzoMin: richiesta.fasciaPrezzoMin !== null ? Number(richiesta.fasciaPrezzoMin) : null,
    fasciaPrezzoMax: richiesta.fasciaPrezzoMax !== null ? Number(richiesta.fasciaPrezzoMax) : null,
    creataIl: richiesta.createdAt,
  };
}

/** Conteggio delle consultazioni da parte del cliente - il segnale di apprendimento dell'esperimento. */
export async function numeroConsultazioniCliente(richiestaId: string): Promise<number> {
  const eventi = await db.eventoAttivita.findMany({
    where: { richiestaId, tipo: 'STATO_CONSULTATO_DAL_CLIENTE' },
  });
  return eventi.length;
}
