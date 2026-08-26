import { db } from '@/server/db';

export type VoceListino = {
  id: string;
  categoria: string;
  codice: string;
  nome: string;
  descrizione: string | null;
  unita: string;
  prezzo: number;
  attivo: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type StoricoListino = {
  id: string;
  listinoPrezzoId: string;
  prezzoPrecedente: number;
  prezzoNuovo: number;
  motivo: string | null;
  changedAt: Date;
};

export async function elencoPrezziListino(tenantId: string): Promise<VoceListino[]> {
  return db.$queryRaw<VoceListino[]>`
    SELECT "id", "categoria", "codice", "nome", "descrizione", "unita",
      "prezzo"::float8 AS "prezzo", "attivo", "createdAt", "updatedAt"
    FROM "listino_prezzo"
    WHERE "tenantId" = ${tenantId}
    ORDER BY "attivo" DESC, "categoria", "nome"
  `;
}

export async function storicoPrezzoListino(tenantId: string, listinoPrezzoId: string): Promise<StoricoListino[]> {
  return db.$queryRaw<StoricoListino[]>`
    SELECT "id", "listinoPrezzoId", "prezzoPrecedente"::float8 AS "prezzoPrecedente",
      "prezzoNuovo"::float8 AS "prezzoNuovo", "motivo", "changedAt"
    FROM "listino_prezzo_storico"
    WHERE "tenantId" = ${tenantId} AND "listinoPrezzoId" = ${listinoPrezzoId}
    ORDER BY "changedAt" DESC
    LIMIT 20
  `;
}

export async function cercaPrezziListino(tenantId: string, query: string, unita?: string): Promise<VoceListino[]> {
  const termine = query.trim();
  if (!termine) return [];
  const unitaFiltro = unita?.trim() || null;

  return db.$queryRaw<VoceListino[]>`
    SELECT "id", "categoria", "codice", "nome", "descrizione", "unita",
      "prezzo"::float8 AS "prezzo", "attivo", "createdAt", "updatedAt"
    FROM "listino_prezzo"
    WHERE "tenantId" = ${tenantId}
      AND "attivo" = true
      AND ("nome" ILIKE ${`%${termine}%`} OR "codice" ILIKE ${`%${termine}%`} OR COALESCE("descrizione", '') ILIKE ${`%${termine}%`})
      AND (${unitaFiltro}::text IS NULL OR "unita" = ${unitaFiltro})
    ORDER BY CASE
      WHEN LOWER("nome") = LOWER(${termine}) THEN 0
      WHEN LOWER("codice") = LOWER(${termine}) THEN 1
      WHEN LOWER("nome") LIKE LOWER(${`${termine}%`}) THEN 2
      ELSE 3
    END, "nome"
    LIMIT 8
  `;
}

export async function creaPrezzoListino(tenantId: string, dati: {
  categoria: string; codice: string; nome: string; descrizione?: string | null; unita: string; prezzo: number;
}) {
  return db.$queryRaw<VoceListino[]>`
    INSERT INTO "listino_prezzo" ("id", "tenantId", "categoria", "codice", "nome", "descrizione", "unita", "prezzo")
    VALUES (${crypto.randomUUID()}, ${tenantId}, ${dati.categoria}, ${dati.codice}, ${dati.nome}, ${dati.descrizione ?? null}, ${dati.unita}, ${dati.prezzo})
    RETURNING "id", "categoria", "codice", "nome", "descrizione", "unita", "prezzo"::float8 AS "prezzo", "attivo", "createdAt", "updatedAt"
  `;
}

export async function aggiornaPrezzoListino(tenantId: string, id: string, dati: Partial<{ categoria: string; codice: string; nome: string; descrizione: string | null; unita: string; prezzo: number }>, motivo?: string) {
  const esistente = await db.$queryRaw<Array<{ prezzo: number }>>`
    SELECT "prezzo"::float8 AS "prezzo" FROM "listino_prezzo" WHERE "tenantId" = ${tenantId} AND "id" = ${id}
  `;
  if (esistente.length === 0) throw new Error('Voce di listino non trovata.');
  const nuovoPrezzo = dati.prezzo ?? esistente[0].prezzo;

  await db.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE "listino_prezzo"
      SET "categoria" = COALESCE(${dati.categoria ?? null}, "categoria"),
          "codice" = COALESCE(${dati.codice ?? null}, "codice"),
          "nome" = COALESCE(${dati.nome ?? null}, "nome"),
          "descrizione" = CASE WHEN ${dati.descrizione === undefined} THEN "descrizione" ELSE ${dati.descrizione ?? null} END,
          "unita" = COALESCE(${dati.unita ?? null}, "unita"), "prezzo" = ${nuovoPrezzo}, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "tenantId" = ${tenantId} AND "id" = ${id}
    `;
    if (Math.abs(nuovoPrezzo - esistente[0].prezzo) > 0.000001) {
      await tx.$executeRaw`
        INSERT INTO "listino_prezzo_storico" ("id", "listinoPrezzoId", "tenantId", "prezzoPrecedente", "prezzoNuovo", "motivo")
        VALUES (${crypto.randomUUID()}, ${id}, ${tenantId}, ${esistente[0].prezzo}, ${nuovoPrezzo}, ${motivo ?? null})
      `;
    }
  });
}

export async function impostaAttivoPrezzoListino(tenantId: string, id: string, attivo: boolean) {
  const result = await db.$executeRaw`
    UPDATE "listino_prezzo" SET "attivo" = ${attivo}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "tenantId" = ${tenantId} AND "id" = ${id}
  `;
  if (result === 0) throw new Error('Voce di listino non trovata.');
}
