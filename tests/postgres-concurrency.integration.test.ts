import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { TIMEOUT_TEST_MS, attendiSessioniInAttesa, conLockDetenuto } from './helpers/postgres-lock';
import { databaseUrlLocaleDiTest } from './helpers/database-test';

/**
 * Prova d'integrazione PostgreSQL reale del protocollo di lock condiviso.
 * Eseguita solo dalla CI, su un database usa-e-getta dedicato.
 */
const enabled = process.env.RUN_POSTGRES_CONCURRENCY_TESTS === 'true';
const describePostgres = enabled ? describe : describe.skip;

const databaseUrl = process.env.DATABASE_URL;
if (enabled && !databaseUrlLocaleDiTest(databaseUrl)) {
  throw new Error(
    'Il test di concorrenza richiede un DATABASE_URL locale con nome contenente "test".',
  );
}

const prisma =
  enabled && databaseUrl
    ? new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) })
    : null;

const schema = `concurrency_probe_${process.env.GITHUB_RUN_ID ?? 'local'}_${process.env.GITHUB_RUN_ATTEMPT ?? '1'}`;

describePostgres('concorrenza PostgreSQL reale — lock padre produzione', () => {
  beforeAll(async () => {
    await prisma!.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    await prisma!.$executeRawUnsafe(
      `CREATE TABLE "${schema}".commessa (id text PRIMARY KEY, stato text NOT NULL)`,
    );
    await prisma!.$executeRawUnsafe(
      `CREATE TABLE "${schema}".riga (id text PRIMARY KEY, commessa_id text NOT NULL REFERENCES "${schema}".commessa(id), stato text NOT NULL)`,
    );
    await prisma!.$executeRawUnsafe(
      `INSERT INTO "${schema}".commessa VALUES ('c1', 'IN_PRODUZIONE')`,
    );
    await prisma!.$executeRawUnsafe(
      `INSERT INTO "${schema}".riga VALUES ('r1', 'c1', 'IN_LAVORAZIONE')`,
    );
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      await prisma.$disconnect();
    }
  });

  it(
    'serializza aggiornamento riga e gate PRONTA sulla stessa riga padre',
    async () => {
      const leggiStatoCommessa = async () => {
        const righe = await prisma!.$queryRawUnsafe<Array<{ stato: string }>>(
          `SELECT stato FROM "${schema}".commessa WHERE id = 'c1'`,
        );
        return righe[0]?.stato;
      };

      const gatePronta = await conLockDetenuto(
        prisma!,
        // Prima transazione: blocca la riga padre e completa la riga figlia,
        // senza fare commit finché il test non ha visto la seconda in attesa.
        async (tx) => {
          await tx.$queryRawUnsafe(
            `SELECT id FROM "${schema}".commessa WHERE id = 'c1' FOR UPDATE`,
          );
          await tx.$executeRawUnsafe(
            `UPDATE "${schema}".riga SET stato = 'COMPLETATA' WHERE id = 'r1'`,
          );
        },
        async (pidBloccante) => {
          const inCorso = prisma!.$transaction(async (tx) => {
            await tx.$queryRawUnsafe(
              `SELECT id FROM "${schema}".commessa WHERE id = 'c1' FOR UPDATE`,
            );
            const righeIncomplete = await tx.$queryRawUnsafe<Array<{ id: string }>>(
              `SELECT id FROM "${schema}".riga WHERE commessa_id = 'c1' AND stato <> 'COMPLETATA'`,
            );
            if (righeIncomplete.length === 0) {
              await tx.$executeRawUnsafe(
                `UPDATE "${schema}".commessa SET stato = 'PRONTA' WHERE id = 'c1'`,
              );
            }
            return righeIncomplete.length;
          });
          inCorso.catch(() => undefined);

          // PostgreSQL deve dichiarare la seconda sessione in attesa del lock
          // della prima, sulla stessa istruzione, prima di ogni rilascio.
          const [inAttesa] = await attendiSessioniInAttesa(prisma!, pidBloccante);
          expect(inAttesa.waitEventType).toBe('Lock');
          expect(inAttesa.query).toContain(`"${schema}".commessa`);
          expect(inAttesa.query).toContain('FOR UPDATE');

          // Con il lock ancora detenuto, il gate non ha scritto nulla.
          expect(await leggiStatoCommessa()).toBe('IN_PRODUZIONE');
          return { inCorso };
        },
      );

      expect(await gatePronta.inCorso).toBe(0);
      expect(await leggiStatoCommessa()).toBe('PRONTA');
    },
    TIMEOUT_TEST_MS,
  );
});
