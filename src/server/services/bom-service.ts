import { db } from '@/server/db';

export type StatoBom = 'BOZZA' | 'CONFERMATA' | 'CHIUSA';

export interface CreaBomInput {
  richiestaId: string;
  noteProduzione?: string | null;
}

export interface CreaBomRigaInput {
  categoria: string;
  codice?: string | null;
  descrizione: string;
  unita?: string;
  quantita: number;
  materiale?: string | null;
  lavorazione?: string | null;
  costoUnitario?: number | null;
  note?: string | null;
  ordinamento?: number;
}

function assertQuantita(quantita: number) {
  if (!Number.isFinite(quantita) || quantita <= 0) throw new Error('La quantità BOM deve essere maggiore di zero.');
}

/**
 * BOM foundation using the additive SQL schema. Every operation receives tenantId
 * explicitly and verifies ownership through the request/BOM relation.
 * This service deliberately does not invent material prices or derive production
 * quantities from the public configurator until explicit product rules exist.
 */
export async function creaBom(tenantId: string, input: CreaBomInput) {
  const richiesta = await db.richiestaProgetto.findFirst({ where: { id: input.richiestaId, tenantId }, select: { id: true } });
  if (!richiesta) throw new Error('Richiesta non trovata.');

  const esistente = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "bom" WHERE "tenantId" = ${tenantId} AND "richiestaId" = ${input.richiestaId} LIMIT 1
  `;
  if (esistente.length) return esistente[0].id;

  const id = crypto.randomUUID();
  await db.$executeRaw`
    INSERT INTO "bom" ("id", "tenantId", "richiestaId", "stato", "versione", "noteProduzione", "createdAt", "updatedAt")
    VALUES (${id}, ${tenantId}, ${input.richiestaId}, 'BOZZA', 1, ${input.noteProduzione ?? null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  return id;
}

export async function dettaglioBom(tenantId: string, bomId: string) {
  const rows = await db.$queryRaw<any[]>`
    SELECT b.*, COALESCE(json_agg(br ORDER BY br."ordinamento", br."createdAt") FILTER (WHERE br."id" IS NOT NULL), '[]') AS righe
    FROM "bom" b
    LEFT JOIN "bom_riga" br ON br."bomId" = b."id"
    WHERE b."id" = ${bomId} AND b."tenantId" = ${tenantId}
    GROUP BY b."id"
  `;
  return rows[0] ?? null;
}

export async function aggiungiRigaBom(tenantId: string, bomId: string, input: CreaBomRigaInput) {
  assertQuantita(input.quantita);
  const bom = await db.$queryRaw<Array<{ id: string; stato: StatoBom }>>`
    SELECT "id", "stato" FROM "bom" WHERE "id" = ${bomId} AND "tenantId" = ${tenantId} LIMIT 1
  `;
  if (!bom.length) throw new Error('Distinta non trovata.');
  if (bom[0].stato !== 'BOZZA') throw new Error('La distinta non è più modificabile.');

  const id = crypto.randomUUID();
  await db.$executeRaw`
    INSERT INTO "bom_riga" ("id", "bomId", "ordinamento", "categoria", "codice", "descrizione", "unita", "quantita", "materiale", "lavorazione", "costoUnitario", "note", "createdAt", "updatedAt")
    VALUES (${id}, ${bomId}, ${input.ordinamento ?? 0}, ${input.categoria}, ${input.codice ?? null}, ${input.descrizione}, ${input.unita ?? 'pz'}, ${input.quantita}, ${input.materiale ?? null}, ${input.lavorazione ?? null}, ${input.costoUnitario ?? null}, ${input.note ?? null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `;
  return id;
}

export async function cambiaStatoBom(tenantId: string, bomId: string, stato: StatoBom) {
  const esito = await db.$executeRaw`
    UPDATE "bom" SET "stato" = ${stato}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${bomId} AND "tenantId" = ${tenantId}
  `;
  if (esito === 0) throw new Error('Distinta non trovata.');
}
