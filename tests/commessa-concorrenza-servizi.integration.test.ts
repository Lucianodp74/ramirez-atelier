import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

/**
 * Prova d'integrazione dei servizi REALI `aggiornaStatoRigaProduzione` e
 * `cambiaStatoCommessa` su PostgreSQL: completa il limite dichiarato in
 * `postgres-concurrency.integration.test.ts`, che verifica il protocollo di
 * lock su tabelle sintetiche ma non richiama il codice applicativo.
 *
 * Eseguita solo dalla CI, sul database usa-e-getta già migrato dal workflow.
 * Crea un Tenant dedicato alla propria esecuzione e lo rimuove alla fine.
 */
const enabled = process.env.RUN_POSTGRES_CONCURRENCY_TESTS === 'true';
const describePostgres = enabled ? describe : describe.skip;

if (enabled) {
  const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  // Confronto esatto sull'host: un nome che "contiene" localhost non basta.
  if (!url || !['localhost', '127.0.0.1'].includes(url.hostname) || !/test/i.test(url.pathname)) {
    throw new Error(
      'Il test di concorrenza richiede un DATABASE_URL locale con nome contenente "test".',
    );
  }
}

type Db = (typeof import('@/server/db'))['db'];
type Servizio = typeof import('@/server/services/commessa-service');

const suffisso = `${process.env.GITHUB_RUN_ID ?? 'local'}-${process.env.GITHUB_RUN_ATTEMPT ?? '1'}-${Date.now()}`;
const COMMESSA_ID = `commessa-concorrenza-${suffisso}`;
const RIGA_ID = `riga-concorrenza-${suffisso}`;
const ATTESA_LOCK_MS = 300;

let db: Db;
let servizio: Servizio;
let tenantId: string;
let tipoProgettoId: string;
let richiestaId: string;

const pausa = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Esito di una promise dopo `ATTESA_LOCK_MS`: serve a osservare che sia bloccata. */
function esitoDopoAttesa(promise: Promise<unknown>) {
  return Promise.race([
    promise.then(
      () => 'risolta' as const,
      () => 'rifiutata' as const,
    ),
    pausa(ATTESA_LOCK_MS).then(() => 'in attesa' as const),
  ]);
}

async function leggiStato() {
  const commesse = await db.$queryRaw<Array<{ stato: string }>>`
    SELECT "stato" FROM "commessa" WHERE "id" = ${COMMESSA_ID}
  `;
  const righe = await db.$queryRaw<Array<{ statoLavorazione: string }>>`
    SELECT "statoLavorazione" FROM "commessa_riga_produzione" WHERE "id" = ${RIGA_ID}
  `;
  return { commessa: commesse[0]?.stato, riga: righe[0]?.statoLavorazione };
}

async function ripristina(statoRiga: string) {
  await db.$executeRaw`
    UPDATE "commessa" SET "stato" = 'IN_PRODUZIONE', "prontaIl" = NULL WHERE "id" = ${COMMESSA_ID}
  `;
  await db.$executeRaw`
    UPDATE "commessa_riga_produzione" SET "statoLavorazione" = ${statoRiga} WHERE "id" = ${RIGA_ID}
  `;
}

/**
 * Apre una transazione che detiene il lock sulla riga padre della commessa,
 * come farebbe un'operazione concorrente, finché non viene chiamato `rilascia`.
 */
async function bloccaCommessa() {
  let segnalaLock!: () => void;
  const lockAcquisito = new Promise<void>((resolve) => {
    segnalaLock = resolve;
  });
  let rilascia!: () => void;
  const rilascio = new Promise<void>((resolve) => {
    rilascia = resolve;
  });

  const transazione = db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "commessa" WHERE "id" = ${COMMESSA_ID} FOR UPDATE`;
    segnalaLock();
    await rilascio;
  });

  await lockAcquisito;
  return { rilascia, transazione };
}

describePostgres('concorrenza PostgreSQL reale — servizi commessa', () => {
  beforeAll(async () => {
    ({ db } = await import('@/server/db'));
    servizio = await import('@/server/services/commessa-service');

    const tenant = await db.tenant.create({
      data: { nome: 'Tenant prova concorrenza', slug: `prova-concorrenza-${suffisso}` },
    });
    tenantId = tenant.id;

    const tipoProgetto = await db.tipoProgetto.create({
      data: {
        tenantId,
        chiave: 'prova-concorrenza',
        nome: 'Prova concorrenza',
        configurazione: {},
      },
    });
    tipoProgettoId = tipoProgetto.id;

    const richiesta = await db.richiestaProgetto.create({
      data: { tenantId, tipoProgettoId, clienteNome: 'Cliente di prova' },
    });
    richiestaId = richiesta.id;

    await db.$executeRaw`
      INSERT INTO "commessa" ("id", "tenantId", "richiestaId", "numero", "stato")
      VALUES (${COMMESSA_ID}, ${tenantId}, ${richiestaId}, 'PROVA-CONCORRENZA', 'IN_PRODUZIONE')
    `;
    await db.$executeRaw`
      INSERT INTO "commessa_riga_produzione"
        ("id", "tenantId", "commessaId", "categoria", "descrizione", "quantita", "statoLavorazione")
      VALUES (${RIGA_ID}, ${tenantId}, ${COMMESSA_ID}, 'PANNELLI', 'Riga di prova', 1, 'IN_LAVORAZIONE')
    `;
  });

  afterAll(async () => {
    if (!db) return;
    await db.$executeRaw`DELETE FROM "commessa" WHERE "id" = ${COMMESSA_ID}`;
    if (richiestaId) await db.richiestaProgetto.deleteMany({ where: { id: richiestaId } });
    if (tipoProgettoId) await db.tipoProgetto.deleteMany({ where: { id: tipoProgettoId } });
    if (tenantId) await db.tenant.deleteMany({ where: { id: tenantId } });
    await db.$disconnect();
  });

  beforeEach(async () => {
    await ripristina('IN_LAVORAZIONE');
  });

  it('aggiornaStatoRigaProduzione attende il lock sulla commessa prima di scrivere', async () => {
    const blocco = await bloccaCommessa();

    const aggiornamento = servizio.aggiornaStatoRigaProduzione(
      tenantId,
      COMMESSA_ID,
      RIGA_ID,
      'COMPLETATA',
    );

    expect(await esitoDopoAttesa(aggiornamento)).toBe('in attesa');
    expect((await leggiStato()).riga).toBe('IN_LAVORAZIONE');

    blocco.rilascia();
    await blocco.transazione;
    await aggiornamento;

    expect(await leggiStato()).toEqual({ commessa: 'IN_PRODUZIONE', riga: 'COMPLETATA' });
  });

  it('cambiaStatoCommessa verso PRONTA attende il lock sulla commessa prima di valutare il gate', async () => {
    await ripristina('COMPLETATA');
    const blocco = await bloccaCommessa();

    const transizione = servizio.cambiaStatoCommessa(tenantId, COMMESSA_ID, 'PRONTA');

    expect(await esitoDopoAttesa(transizione)).toBe('in attesa');
    expect((await leggiStato()).commessa).toBe('IN_PRODUZIONE');

    blocco.rilascia();
    await blocco.transazione;
    const dettaglio = await transizione;

    expect(dettaglio?.stato).toBe('PRONTA');
    expect(await leggiStato()).toEqual({ commessa: 'PRONTA', riga: 'COMPLETATA' });
  });

  it('non lascia mai una commessa PRONTA con una riga riaperta in concorrenza', async () => {
    for (let giro = 0; giro < 20; giro += 1) {
      await ripristina('COMPLETATA');

      const [transizione, riapertura] = await Promise.allSettled([
        servizio.cambiaStatoCommessa(tenantId, COMMESSA_ID, 'PRONTA'),
        servizio.aggiornaStatoRigaProduzione(tenantId, COMMESSA_ID, RIGA_ID, 'DA_FARE'),
      ]);

      // Le due operazioni sono mutuamente esclusive: vince la prima che ottiene il lock.
      const esiti = [transizione.status, riapertura.status];
      expect(esiti.filter((esito) => esito === 'fulfilled')).toHaveLength(1);

      const stato = await leggiStato();
      expect(stato).toEqual(
        transizione.status === 'fulfilled'
          ? { commessa: 'PRONTA', riga: 'COMPLETATA' }
          : { commessa: 'IN_PRODUZIONE', riga: 'DA_FARE' },
      );
    }
  });
});
