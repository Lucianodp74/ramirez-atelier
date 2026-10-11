import type { Prisma, PrismaClient } from '@prisma/client';

/**
 * Strumenti per le prove di concorrenza su PostgreSQL reale.
 *
 * Nessuna attesa "a tempo" per dedurre che una transazione sia bloccata: lo
 * stato di attesa viene letto da PostgreSQL (`pg_stat_activity` e
 * `pg_blocking_pids()`), a partire dal pid della sessione che detiene il lock.
 * Il pid è univoco per sessione, quindi identifica solo le sessioni di questo
 * test anche con altri test in esecuzione sullo stesso database.
 */

/** Tempo massimo concesso a una sessione concorrente per mettersi in coda sul lock. */
export const TIMEOUT_ATTESA_LOCK_MS = 10_000;
/** Durata massima della transazione che detiene il lock (lato Prisma). */
export const TIMEOUT_TRANSAZIONE_MS = 20_000;
/** Timeout del singolo test: sopra ai due precedenti, sotto a un blocco indefinito. */
export const TIMEOUT_TEST_MS = 30_000;
const INTERVALLO_LETTURA_MS = 20;

export interface SessioneInAttesa {
  pid: number;
  waitEventType: string | null;
  waitEvent: string | null;
  query: string;
}

/**
 * Sessioni che PostgreSQL dichiara in attesa di un lock detenuto, direttamente
 * o in catena, dalla sessione `pidBloccante`. La catena serve quando più
 * sessioni sono in coda sulla stessa riga: la seconda risulta bloccata dalla
 * prima in coda, non da chi detiene il lock.
 */
export async function sessioniInAttesaDi(
  db: PrismaClient,
  pidBloccante: number,
): Promise<SessioneInAttesa[]> {
  return db.$queryRaw<SessioneInAttesa[]>`
    WITH RECURSIVE bloccate AS (
      SELECT a.pid
      FROM pg_stat_activity a
      WHERE ${pidBloccante}::int4 = ANY(pg_blocking_pids(a.pid))
      UNION
      SELECT a.pid
      FROM pg_stat_activity a
      JOIN bloccate b ON b.pid = ANY(pg_blocking_pids(a.pid))
    )
    SELECT a.pid,
           a.wait_event_type AS "waitEventType",
           a.wait_event AS "waitEvent",
           a.query
    FROM pg_stat_activity a
    JOIN bloccate USING (pid)
    WHERE a.datname = current_database()
      AND a.state = 'active'
      AND a.wait_event_type = 'Lock'
    ORDER BY a.pid
  `;
}

/**
 * Attende che PostgreSQL riporti almeno `quante` sessioni in attesa del lock
 * detenuto da `pidBloccante`. Se non accade entro il timeout il test fallisce
 * con un errore esplicito: non prosegue mai "sulla fiducia".
 */
export async function attendiSessioniInAttesa(
  db: PrismaClient,
  pidBloccante: number,
  quante = 1,
  timeoutMs = TIMEOUT_ATTESA_LOCK_MS,
): Promise<SessioneInAttesa[]> {
  const scadenza = Date.now() + timeoutMs;
  let ultime: SessioneInAttesa[] = [];
  while (Date.now() < scadenza) {
    ultime = await sessioniInAttesaDi(db, pidBloccante);
    if (ultime.length >= quante) return ultime;
    await new Promise((resolve) => setTimeout(resolve, INTERVALLO_LETTURA_MS));
  }
  throw new Error(
    `Entro ${timeoutMs} ms PostgreSQL ha riportato ${ultime.length} sessioni in attesa del lock ` +
      `detenuto dal pid ${pidBloccante}, ne erano attese ${quante}.`,
  );
}

/**
 * Esegue `corpo` mentre una transazione dedicata detiene i lock presi da
 * `acquisisci`. Il lock viene rilasciato solo quando `corpo` termina: se
 * `corpo` fallisce (asserzione, timeout di attesa) la transazione viene
 * comunque chiusa prima di propagare l'errore.
 *
 * Reti di sicurezza, tutte indipendenti dal test:
 *  - `idle_in_transaction_session_timeout`: è PostgreSQL a chiudere la
 *    sessione se il processo di test smette di rispondere;
 *  - timeout della transazione interattiva Prisma;
 *  - timeout del test (`TIMEOUT_TEST_MS`).
 */
export async function conLockDetenuto<T>(
  db: PrismaClient,
  acquisisci: (tx: Prisma.TransactionClient) => Promise<void>,
  corpo: (pidBloccante: number) => Promise<T>,
): Promise<T> {
  let segnalaLock!: (pid: number) => void;
  const lockAcquisito = new Promise<number>((resolve) => {
    segnalaLock = resolve;
  });
  let rilascia!: () => void;
  const rilascio = new Promise<void>((resolve) => {
    rilascia = resolve;
  });

  const transazione = db.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL idle_in_transaction_session_timeout = '${TIMEOUT_TRANSAZIONE_MS}ms'`,
      );
      const sessione = await tx.$queryRaw<Array<{ pid: number }>>`SELECT pg_backend_pid() AS pid`;
      await acquisisci(tx);
      segnalaLock(sessione[0].pid);
      await rilascio;
    },
    { timeout: TIMEOUT_TRANSAZIONE_MS, maxWait: TIMEOUT_ATTESA_LOCK_MS },
  );

  // Se la transazione fallisce prima di ottenere il lock, l'errore emerge qui.
  const chiusuraAnticipata = transazione.then((): never => {
    throw new Error('La transazione che doveva detenere il lock si è chiusa in anticipo.');
  });
  // A lock ottenuto questa promise non interessa più: la chiusura è attesa sotto.
  chiusuraAnticipata.catch(() => undefined);
  const pidBloccante = await Promise.race([lockAcquisito, chiusuraAnticipata]);

  let esito: T;
  try {
    esito = await corpo(pidBloccante);
  } catch (errore) {
    rilascia();
    await transazione.catch(() => undefined);
    throw errore;
  }
  rilascia();
  await transazione;
  return esito;
}
