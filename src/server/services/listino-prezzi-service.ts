import { db } from '@/server/db';

export type TipoListino = 'MATERIALE' | 'COMPONENTE' | 'COMPOSIZIONE';

export type VoceListino = {
  id: string;
  tipo: TipoListino;
  categoria: string;
  codice: string;
  nome: string;
  descrizione: string | null;
  unita: string;
  prezzo: number;
  attivo: boolean;
  materiale: string | null;
  larghezzaCm: number | null;
  altezzaCm: number | null;
  profonditaCm: number | null;
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
    SELECT "id", "tipo", "categoria", "codice", "nome", "descrizione", "unita",
      "prezzo"::float8 AS "prezzo", "attivo", "materiale",
      "larghezzaCm"::float8 AS "larghezzaCm", "altezzaCm"::float8 AS "altezzaCm",
      "profonditaCm"::float8 AS "profonditaCm", "createdAt", "updatedAt"
    FROM "listino_prezzo"
    WHERE "tenantId" = ${tenantId}
    ORDER BY "attivo" DESC, "tipo", "categoria", "nome"
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
    SELECT "id", "tipo", "categoria", "codice", "nome", "descrizione", "unita",
      "prezzo"::float8 AS "prezzo", "attivo", "materiale",
      "larghezzaCm"::float8 AS "larghezzaCm", "altezzaCm"::float8 AS "altezzaCm",
      "profonditaCm"::float8 AS "profonditaCm", "createdAt", "updatedAt"
    FROM "listino_prezzo"
    WHERE "tenantId" = ${tenantId}
      AND "attivo" = true
      AND ("nome" ILIKE ${`%${termine}%`} OR "codice" ILIKE ${`%${termine}%`} OR COALESCE("descrizione", '') ILIKE ${`%${termine}%`} OR COALESCE("materiale", '') ILIKE ${`%${termine}%`})
      AND (${unitaFiltro}::text IS NULL OR "unita" = ${unitaFiltro})
    ORDER BY CASE
      WHEN LOWER("nome") = LOWER(${termine}) THEN 0
      WHEN LOWER("codice") = LOWER(${termine}) THEN 1
      WHEN LOWER("nome") LIKE LOWER(${`${termine}%`}) THEN 2
      ELSE 3
    END, CASE "tipo" WHEN 'COMPOSIZIONE' THEN 0 WHEN 'MATERIALE' THEN 1 ELSE 2 END, "nome"
    LIMIT 8
  `;
}

export async function creaPrezzoListino(tenantId: string, dati: {
  tipo?: TipoListino;
  categoria: string;
  codice: string;
  nome: string;
  descrizione?: string | null;
  unita: string;
  prezzo: number;
  attivo?: boolean;
  materiale?: string | null;
  larghezzaCm?: number | null;
  altezzaCm?: number | null;
  profonditaCm?: number | null;
}) {
  if (!Number.isFinite(dati.prezzo) || dati.prezzo < 0) throw new Error('Il prezzo deve essere un numero finito maggiore o uguale a zero.');
  if (!dati.codice.trim()) throw new Error('Il codice è obbligatorio.');
  if (!dati.unita.trim()) throw new Error("L'unità di misura è obbligatoria.");

  return db.$queryRaw<VoceListino[]>`
    INSERT INTO "listino_prezzo" ("id", "tenantId", "tipo", "categoria", "codice", "nome", "descrizione", "unita", "prezzo", "attivo", "materiale", "larghezzaCm", "altezzaCm", "profonditaCm")
    VALUES (${crypto.randomUUID()}, ${tenantId}, ${dati.tipo ?? 'COMPONENTE'}, ${dati.categoria}, ${dati.codice}, ${dati.nome}, ${dati.descrizione ?? null}, ${dati.unita}, ${dati.prezzo}, ${dati.attivo ?? true}, ${dati.materiale ?? null}, ${dati.larghezzaCm ?? null}, ${dati.altezzaCm ?? null}, ${dati.profonditaCm ?? null})
    RETURNING "id", "tipo", "categoria", "codice", "nome", "descrizione", "unita", "prezzo"::float8 AS "prezzo", "attivo", "materiale", "larghezzaCm"::float8 AS "larghezzaCm", "altezzaCm"::float8 AS "altezzaCm", "profonditaCm"::float8 AS "profonditaCm", "createdAt", "updatedAt"
  `;
}

export async function aggiornaPrezzoListino(tenantId: string, id: string, dati: Partial<{ categoria: string; codice: string; nome: string; descrizione: string | null; unita: string; prezzo: number; tipo: TipoListino; materiale: string | null; larghezzaCm: number | null; altezzaCm: number | null; profonditaCm: number | null }>, motivo?: string) {
  const esistente = await db.$queryRaw<Array<{ prezzo: number }>>`
    SELECT "prezzo"::float8 AS "prezzo" FROM "listino_prezzo" WHERE "tenantId" = ${tenantId} AND "id" = ${id}
  `;
  if (esistente.length === 0) throw new Error('Voce di listino non trovata.');
  const nuovoPrezzo = dati.prezzo ?? esistente[0].prezzo;
  if (!Number.isFinite(nuovoPrezzo) || nuovoPrezzo < 0) throw new Error('Il prezzo deve essere un numero finito maggiore o uguale a zero.');
  if (dati.unita !== undefined && !dati.unita.trim()) throw new Error("L'unità di misura è obbligatoria.");
  if (dati.codice !== undefined && !dati.codice.trim()) throw new Error('Il codice è obbligatorio.');

  await db.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE "listino_prezzo"
      SET "tipo" = COALESCE(${dati.tipo ?? null}, "tipo"),
          "categoria" = COALESCE(${dati.categoria ?? null}, "categoria"),
          "codice" = COALESCE(${dati.codice ?? null}, "codice"),
          "nome" = COALESCE(${dati.nome ?? null}, "nome"),
          "descrizione" = CASE WHEN ${dati.descrizione === undefined} THEN "descrizione" ELSE ${dati.descrizione ?? null} END,
          "unita" = COALESCE(${dati.unita ?? null}, "unita"),
          "materiale" = CASE WHEN ${dati.materiale === undefined} THEN "materiale" ELSE ${dati.materiale ?? null} END,
          "larghezzaCm" = CASE WHEN ${dati.larghezzaCm === undefined} THEN "larghezzaCm" ELSE ${dati.larghezzaCm ?? null} END,
          "altezzaCm" = CASE WHEN ${dati.altezzaCm === undefined} THEN "altezzaCm" ELSE ${dati.altezzaCm ?? null} END,
          "profonditaCm" = CASE WHEN ${dati.profonditaCm === undefined} THEN "profonditaCm" ELSE ${dati.profonditaCm ?? null} END,
          "prezzo" = ${nuovoPrezzo}, "updatedAt" = CURRENT_TIMESTAMP
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
