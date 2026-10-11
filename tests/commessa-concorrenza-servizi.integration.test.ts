import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  TIMEOUT_TEST_MS,
  attendiSessioniInAttesa,
  conLockDetenuto,
  type SessioneInAttesa,
} from './helpers/postgres-lock';

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

let db: Db;
let servizio: Servizio;
let tenantId: string;
let tipoProgettoId: string;
let richiestaId: string;

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
 * Esegue `corpo` mentre una seconda transazione detiene il lock sulla riga
 * padre della commessa, come farebbe un'operazione concorrente.
 */
function conCommessaBloccata<T>(corpo: (pidBloccante: number) => Promise<T>) {
  return conLockDetenuto(
    db,
    async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "commessa" WHERE "id" = ${COMMESSA_ID} FOR UPDATE`;
    },
    corpo,
  );
}

/** Le sessioni in attesa devono essere ferme sul lock della commessa, non altrove. */
function verificaAttesaSulLockCommessa(sessioni: SessioneInAttesa[]) {
  for (const sessione of sessioni) {
    expect(sessione.waitEventType).toBe('Lock');
    expect(sessione.query).toContain('"commessa"');
    expect(sessione.query).toContain('FOR UPDATE');
  }
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

  it(
    'aggiornaStatoRigaProduzione attende il lock sulla commessa prima di scrivere',
    async () => {
      const aggiornamento = await conCommessaBloccata(async (pidBloccante) => {
        const inCorso = servizio.aggiornaStatoRigaProduzione(
          tenantId,
          COMMESSA_ID,
          RIGA_ID,
          'COMPLETATA',
        );
        inCorso.catch(() => undefined);

        verificaAttesaSulLockCommessa(await attendiSessioniInAttesa(db, pidBloccante));
        // Il servizio è fermo sul lock: la riga non può essere già cambiata.
        expect(await leggiStato()).toEqual({ commessa: 'IN_PRODUZIONE', riga: 'IN_LAVORAZIONE' });
        return { inCorso };
      });

      await aggiornamento.inCorso;
      expect(await leggiStato()).toEqual({ commessa: 'IN_PRODUZIONE', riga: 'COMPLETATA' });
    },
    TIMEOUT_TEST_MS,
  );

  it(
    'cambiaStatoCommessa verso PRONTA attende il lock sulla commessa prima di valutare il gate',
    async () => {
      await ripristina('COMPLETATA');

      const transizione = await conCommessaBloccata(async (pidBloccante) => {
        const inCorso = servizio.cambiaStatoCommessa(tenantId, COMMESSA_ID, 'PRONTA');
        inCorso.catch(() => undefined);

        verificaAttesaSulLockCommessa(await attendiSessioniInAttesa(db, pidBloccante));
        expect(await leggiStato()).toEqual({ commessa: 'IN_PRODUZIONE', riga: 'COMPLETATA' });
        return { inCorso };
      });

      expect((await transizione.inCorso)?.stato).toBe('PRONTA');
      expect(await leggiStato()).toEqual({ commessa: 'PRONTA', riga: 'COMPLETATA' });
    },
    TIMEOUT_TEST_MS,
  );

  it(
    'con entrambe le operazioni in coda sul lock, la commessa non resta mai PRONTA con una riga riaperta',
    async () => {
      const avvia = {
        transizione: (): Promise<unknown> =>
          servizio.cambiaStatoCommessa(tenantId, COMMESSA_ID, 'PRONTA'),
        riapertura: (): Promise<unknown> =>
          servizio.aggiornaStatoRigaProduzione(tenantId, COMMESSA_ID, RIGA_ID, 'DA_FARE'),
      };

      for (let giro = 0; giro < 10; giro += 1) {
        await ripristina('COMPLETATA');
        // A giri alterni cambia chi si mette in coda per primo.
        const transizionePerPrima = giro % 2 === 0;

        const inCorso = await conCommessaBloccata(async (pidBloccante) => {
          const prima = transizionePerPrima ? avvia.transizione() : avvia.riapertura();
          prima.catch(() => undefined);
          await attendiSessioniInAttesa(db, pidBloccante, 1);

          const seconda = transizionePerPrima ? avvia.riapertura() : avvia.transizione();
          seconda.catch(() => undefined);
          // Entrambe le sessioni devono risultare in attesa prima del rilascio.
          verificaAttesaSulLockCommessa(await attendiSessioniInAttesa(db, pidBloccante, 2));
          expect(await leggiStato()).toEqual({ commessa: 'IN_PRODUZIONE', riga: 'COMPLETATA' });

          return transizionePerPrima
            ? { transizione: prima, riapertura: seconda }
            : { transizione: seconda, riapertura: prima };
        });

        const [transizione, riapertura] = await Promise.allSettled([
          inCorso.transizione,
          inCorso.riapertura,
        ]);

        // Mutua esclusione: riesce solo l'operazione che ottiene il lock per prima.
        const riuscite = [transizione, riapertura].filter((e) => e.status === 'fulfilled');
        expect(riuscite).toHaveLength(1);

        // Invariante: PRONTA implica riga COMPLETATA, in qualunque ordine.
        expect(await leggiStato()).toEqual(
          transizione.status === 'fulfilled'
            ? { commessa: 'PRONTA', riga: 'COMPLETATA' }
            : { commessa: 'IN_PRODUZIONE', riga: 'DA_FARE' },
        );
      }
    },
    TIMEOUT_TEST_MS * 2,
  );
});
