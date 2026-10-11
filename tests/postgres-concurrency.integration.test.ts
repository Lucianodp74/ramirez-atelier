import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prova d'integrazione PostgreSQL reale del protocollo di lock condiviso.
 * Eseguita solo dalla CI, su un database usa-e-getta dedicato.
 */
const enabled = process.env.RUN_POSTGRES_CONCURRENCY_TESTS === 'true';
const describePostgres = enabled ? describe : describe.skip;

const databaseUrl = process.env.DATABASE_URL;
if (
  enabled &&
  (!databaseUrl ||
    !/localhost|127\.0\.0\.1/.test(new URL(databaseUrl).hostname) ||
    !/test/i.test(new URL(databaseUrl).pathname))
) {
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

  it('serializza aggiornamento riga e gate PRONTA sulla stessa riga padre', async () => {
    let segnalaLock!: () => void;
    const lockAcquisito = new Promise<void>((resolve) => {
      segnalaLock = resolve;
    });
    let rilasciaPrimaTransazione!: () => void;
    const rilascio = new Promise<void>((resolve) => {
      rilasciaPrimaTransazione = resolve;
    });

    const aggiornamentoRiga = prisma!.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(`SELECT id FROM "${schema}".commessa WHERE id = 'c1' FOR UPDATE`);
      segnalaLock();
      await rilascio;
      await tx.$executeRawUnsafe(
        `UPDATE "${schema}".riga SET stato = 'COMPLETATA' WHERE id = 'r1'`,
      );
    });

    await lockAcquisito;

    const gatePronta = prisma!.$transaction(async (tx) => {
      await tx.$queryRawUnsafe(`SELECT id FROM "${schema}".commessa WHERE id = 'c1' FOR UPDATE`);
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

    // Lascia che la seconda transazione tenti il lock mentre la prima lo detiene.
    await new Promise((resolve) => setTimeout(resolve, 100));
    rilasciaPrimaTransazione();
    await aggiornamentoRiga;
    const incomplete = await gatePronta;

    expect(incomplete).toBe(0);
    const commessa = await prisma!.$queryRawUnsafe<Array<{ stato: string }>>(
      `SELECT stato FROM "${schema}".commessa WHERE id = 'c1'`,
    );
    expect(commessa[0]?.stato).toBe('PRONTA');
  });
});
