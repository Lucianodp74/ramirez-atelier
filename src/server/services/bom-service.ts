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

export interface AggiornaBomRigaInput {
  categoria?: string;
  codigo?: string | null;
  descrizione?: string;
  unita?: string;
  quantita?: number;
  materiale?: string | null;
  lavorazione?: string | null;
  costoUnitario?: number | null;
  note?: string | null;
}

type BomDetailRow = {
  id: string;
  tenantId: string;
  richiestaId: string;
  stato: StatoBom;
  versione: number;
  noteProduzione: string | null;
  createdAt: Date;
  updatedAt: Date;
  righe: BomRigaRow[];
};

type BomRigaRow = {
  id: string;
  bomId: string;
  ordinamento: number;
  categoria: string;
  codice: string | null;
  descrizione: string;
  unita: string;
  quantita: number;
  materiale: string | null;
  lavorazione: string | null;
  costoUnitario: number | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function validaQuantitaBom(quantita: number) {
  if (!Number.isFinite(quantita) || quantita <= 0) {
    throw new Error('La quantità BOM deve essere maggiore di zero.');
  }
}

export function validaCostoUnitarioBom(costoUnitario: number | null | undefined) {
  if (costoUnitario == null) return;
  if (!Number.isFinite(costoUnitario) || costoUnitario < 0) {
    throw new Error('Il costo unitario BOM deve essere un numero maggiore o uguale a zero.');
  }
}

export function validaTransizioneBom(statoCorrente: StatoBom, nuovoStato: StatoBom) {
  if (statoCorrente === nuovoStato) return;

  const consentite: Record<StatoBom, StatoBom[]> = {
    BOZZA: ['CONFERMATA'],
    CONFERMATA: ['CHIUSA'],
    CHIUSA: [],
  };

  if (!consentite[statoCorrente].includes(nuovoStato)) {
    throw new Error(`Transizione BOM non consentita: ${statoCorrente} → ${nuovoStato}.`);
  }
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

  const id = crypto.randomUUID();
  const inserita = await db.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "bom" ("id", "tenantId", "richiestaId", "stato", "versione", "noteProduzione", "createdAt", "updatedAt")
    VALUES (${id}, ${tenantId}, ${input.richiestaId}, 'BOZZA', 1, ${input.noteProduzione ?? null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT ("richiestaId") DO NOTHING
    RETURNING "id"
  `;
  if (inserita[0]) return inserita[0].id;

  const esistente = await db.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "bom" WHERE "tenantId" = ${tenantId} AND "richiestaId" = ${input.richiestaId} LIMIT 1
  `;
  if (esistente[0]) return esistente[0].id;
  throw new Error('Impossibile creare la distinta.');
}

export async function dettaglioBom(tenantId: string, bomId: string): Promise<BomDetailRow | null> {
  const rows = await db.$queryRaw<BomDetailRow[]>`
    SELECT b.*, COALESCE(json_agg(br ORDER BY br."ordinamento", br."createdAt") FILTER (WHERE br."id" IS NOT NULL), '[]') AS righe
    FROM "bom" b
    LEFT JOIN "bom_riga" br ON br."bomId" = b."id"
    WHERE b."id" = ${bomId} AND b."tenantId" = ${tenantId}
    GROUP BY b."id"
  `;
  return rows[0] ?? null;
}

export async function aggiungiRigaBom(tenantId: string, bomId: string, input: CreaBomRigaInput) {
  validaQuantitaBom(input.quantita);
  validaCostoUnitarioBom(input.costoUnitario);
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

export async function aggiornaRigaBom(tenantId: string, rigaId: string, input: AggiornaBomRigaInput) {
  if (input.quantita !== undefined) validaQuantitaBom(input.quantita);
  if (input.costoUnitario !== undefined) validaCostoUnitarioBom(input.costoUnitario);

  const riga = await db.$queryRaw<Array<{ id: string; bomId: string; stato: StatoBom }>>`
    SELECT br."id", br."bomId", b."stato"
    FROM "bom_riga" br
    JOIN "bom" b ON b."id" = br."bomId"
    WHERE br."id" = ${rigaId} AND b."tenantId" = ${tenantId}
    LIMIT 1
  `;
  if (!riga.length) throw new Error('Riga BOM non trovata.');
  if (riga[0].stato !== 'BOZZA') throw new Error('La distinta non è più modificabile.');

  const current = await db.$queryRaw<Array<{
    categoria: string;
    codice: string | null;
    descrizione: string;
    unita: string;
    quantita: number;
    materiale: string | null;
    lavorazione: string | null;
    costoUnitario: number | null;
    note: string | null;
  }>>`
    SELECT "categoria", "codice", "descrizione", "unita", "quantita", "materiale", "lavorazione", "costoUnitario", "note"
    FROM "bom_riga" WHERE "id" = ${rigaId} LIMIT 1
  `;
  const existing = current[0];
  if (!existing) throw new Error('Riga BOM non trovata.');

  await db.$executeRaw`
    UPDATE "bom_riga"
    SET "categoria" = ${input.categoria ?? existing.categoria},
        "codice" = ${input.codigo !== undefined ? input.codigo : existing.codice},
        "descrizione" = ${input.descrizione ?? existing.descrizione},
        "unita" = ${input.unita ?? existing.unita},
        "quantita" = ${input.quantita ?? existing.quantita},
        "materiale" = ${input.materiale !== undefined ? input.materiale : existing.materiale},
        "lavorazione" = ${input.lavorazione !== undefined ? input.lavorazione : existing.lavorazione},
        "costoUnitario" = ${input.costoUnitario !== undefined ? input.costoUnitario : existing.costoUnitario},
        "note" = ${input.note !== undefined ? input.note : existing.note},
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${rigaId}
  `;
}

export async function cambiaStatoBom(tenantId: string, bomId: string, stato: StatoBom) {
  const bom = await db.$queryRaw<Array<{ id: string; stato: StatoBom }>>`
    SELECT "id", "stato" FROM "bom" WHERE "id" = ${bomId} AND "tenantId" = ${tenantId} LIMIT 1
  `;
  if (!bom.length) throw new Error('Distinta non trovata.');

  validaTransizioneBom(bom[0].stato, stato);
  if (bom[0].stato === stato) return;

  await db.$executeRaw`
    UPDATE "bom" SET "stato" = ${stato}, "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${bomId} AND "tenantId" = ${tenantId}
  `;
}
