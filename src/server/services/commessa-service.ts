import { db } from '@/server/db';

export type StatoCommessa =
  | 'DA_AVVIARE'
  | 'IN_PRODUZIONE'
  | 'PRONTA'
  | 'CONSEGNATA'
  | 'CHIUSA'
  | 'ANNULLATA';

export interface RigaProduzione {
  id: string;
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
}

export interface CommessaRow {
  id: string;
  tenantId: string;
  richiestaId: string;
  numero: string;
  stato: StatoCommessa;
  noteProduzione: string | null;
  fonteBomId: string | null;
  fonteBomVersione: number | null;
  dataPrevistaConsegna: Date | null;
  avviataIl: Date | null;
  prontaIl: Date | null;
  consegnataIl: Date | null;
  chiusaIl: Date | null;
  createdAt: Date;
  updatedAt: Date;
  clienteNome: string | null;
  tipoProgettoNome: string;
  righeCount?: number;
}

export interface CommessaDetail extends CommessaRow {
  clienteEmail: string | null;
  clienteTelefono: string | null;
  righe: RigaProduzione[];
}

const TRANSIZIONI: Record<StatoCommessa, StatoCommessa[]> = {
  DA_AVVIARE: ['IN_PRODUZIONE', 'ANNULLATA'],
  IN_PRODUZIONE: ['PRONTA', 'ANNULLATA'],
  PRONTA: ['CONSEGNATA'],
  CONSEGNATA: ['CHIUSA'],
  CHIUSA: [],
  ANNULLATA: [],
};

export const ETICHETTA_STATO_COMMESSA: Record<StatoCommessa, string> = {
  DA_AVVIARE: 'Da avviare',
  IN_PRODUZIONE: 'In produzione',
  PRONTA: 'Pronta',
  CONSEGNATA: 'Consegnata',
  CHIUSA: 'Chiusa',
  ANNULLATA: 'Annullata',
};

export function transizioneCommessaAmmessa(da: StatoCommessa, a: StatoCommessa) {
  return TRANSIZIONI[da].includes(a);
}

export function prossimiStatiCommessa(da: StatoCommessa) {
  return TRANSIZIONI[da];
}

export async function listaCommesse(tenantId: string, stato?: StatoCommessa) {
  return db.$queryRaw<CommessaRow[]>`
    SELECT c."id", c."tenantId", c."richiestaId", c."numero", c."stato",
           c."noteProduzione", c."fonteBomId", c."fonteBomVersione",
           c."dataPrevistaConsegna", c."avviataIl", c."prontaIl",
           c."consegnataIl", c."chiusaIl", c."createdAt", c."updatedAt",
           r."clienteNome", tp."nome" AS "tipoProgettoNome",
           COUNT(cr."id")::int AS "righeCount"
    FROM "commessa" c
    JOIN "richiesta_progetto" r ON r."id" = c."richiestaId"
    JOIN "tipo_progetto" tp ON tp."id" = r."tipoProgettoId"
    LEFT JOIN "commessa_riga_produzione" cr ON cr."commessaId" = c."id"
    WHERE c."tenantId" = ${tenantId}
      AND (${stato ?? null}::text IS NULL OR c."stato" = ${stato ?? null})
    GROUP BY c."id", r."clienteNome", tp."nome"
    ORDER BY
      CASE c."stato"
        WHEN 'IN_PRODUZIONE' THEN 1
        WHEN 'PRONTA' THEN 2
        WHEN 'DA_AVVIARE' THEN 3
        WHEN 'CONSEGNATA' THEN 4
        WHEN 'CHIUSA' THEN 5
        WHEN 'ANNULLATA' THEN 6
        ELSE 7
      END,
      c."updatedAt" DESC
  `;
}

export async function dettaglioCommessa(tenantId: string, id: string): Promise<CommessaDetail | null> {
  const commesse = await db.$queryRaw<CommessaDetail[]>`
    SELECT c."id", c."tenantId", c."richiestaId", c."numero", c."stato",
           c."noteProduzione", c."fonteBomId", c."fonteBomVersione",
           c."dataPrevistaConsegna", c."avviataIl", c."prontaIl",
           c."consegnataIl", c."chiusaIl", c."createdAt", c."updatedAt",
           r."clienteNome", r."clienteEmail", r."clienteTelefono",
           tp."nome" AS "tipoProgettoNome"
    FROM "commessa" c
    JOIN "richiesta_progetto" r ON r."id" = c."richiestaId"
    JOIN "tipo_progetto" tp ON tp."id" = r."tipoProgettoId"
    WHERE c."tenantId" = ${tenantId} AND c."id" = ${id}
    LIMIT 1
  `;
  if (!commesse[0]) return null;

  const righe = await db.$queryRaw<RigaProduzione[]>`
    SELECT cr."id", cr."ordinamento", cr."categoria", cr."codice", cr."descrizione", cr."unita",
           cr."quantita"::float8 AS "quantita", cr."materiale", cr."lavorazione",
           cr."costoUnitario"::float8 AS "costoUnitario", cr."note"
    FROM "commessa_riga_produzione" cr
    WHERE cr."tenantId" = ${tenantId} AND cr."commessaId" = ${id}
    ORDER BY cr."ordinamento", cr."createdAt"
  `;

  return { ...commesse[0], righe };
}

export async function creaCommessaDaRichiesta(tenantId: string, richiestaId: string) {
  return db.$transaction(async (tx) => {
    const richieste = await tx.$queryRaw<Array<{
      id: string;
      stato: string;
      clienteNome: string | null;
      tipoProgettoNome: string;
    }>>`
      SELECT r."id", r."stato", r."clienteNome", tp."nome" AS "tipoProgettoNome"
      FROM "richiesta_progetto" r
      JOIN "tipo_progetto" tp ON tp."id" = r."tipoProgettoId"
      WHERE r."id" = ${richiestaId} AND r."tenantId" = ${tenantId}
      LIMIT 1
    `;
    const richiesta = richieste[0];
    if (!richiesta) throw new Error('Richiesta non trovata.');
    if (richiesta.stato !== 'CONVERTITA') {
      throw new Error('La commessa può essere creata solo da una richiesta CONVERTITA.');
    }

    const esistenti = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "commessa"
      WHERE "tenantId" = ${tenantId} AND "richiestaId" = ${richiestaId}
      LIMIT 1
    `;
    if (esistenti[0]) return esistenti[0].id;

    const bom = await tx.$queryRaw<Array<{ id: string; versione: number; stato: string; noteProduzione: string | null }>>`
      SELECT "id", "versione", "stato", "noteProduzione"
      FROM "bom"
      WHERE "tenantId" = ${tenantId} AND "richiestaId" = ${richiestaId}
      ORDER BY "updatedAt" DESC
      LIMIT 1
    `;
    const fonteBom = bom[0] ?? null;
    if (fonteBom && fonteBom.stato !== 'CONFERMATA') {
      throw new Error('La BOM esiste ma non è confermata. Conferma la BOM prima di avviare la commessa.');
    }

    const id = crypto.randomUUID();
    const numero = `COM-${new Date().getFullYear()}-${id.slice(0, 8).toUpperCase()}`;

    await tx.$executeRaw`
      INSERT INTO "commessa" (
        "id", "tenantId", "richiestaId", "numero", "stato", "noteProduzione",
        "fonteBomId", "fonteBomVersione", "createdAt", "updatedAt"
      ) VALUES (
        ${id}, ${tenantId}, ${richiestaId}, ${numero}, 'DA_AVVIARE',
        ${fonteBom?.noteProduzione ?? null}, ${fonteBom?.id ?? null},
        ${fonteBom?.versione ?? null}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
    `;

    if (fonteBom) {
      const righeBom = await tx.$queryRaw<Array<{
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
      }>>`
        SELECT br."ordinamento", br."categoria", br."codice", br."descrizione", br."unita",
               br."quantita"::float8 AS "quantita", br."materiale", br."lavorazione",
               br."costoUnitario"::float8 AS "costoUnitario", br."note"
        FROM "bom_riga" br
        JOIN "bom" b ON b."id" = br."bomId"
        WHERE b."tenantId" = ${tenantId} AND br."bomId" = ${fonteBom.id}
        ORDER BY br."ordinamento", br."createdAt"
      `;

      for (const riga of righeBom) {
        await tx.$executeRaw`
          INSERT INTO "commessa_riga_produzione" (
            "id", "tenantId", "commessaId", "ordinamento", "categoria", "codice",
            "descrizione", "unita", "quantita", "materiale", "lavorazione",
            "costoUnitario", "note", "createdAt", "updatedAt"
          ) VALUES (
            ${crypto.randomUUID()}, ${tenantId}, ${id}, ${riga.ordinamento}, ${riga.categoria},
            ${riga.codice}, ${riga.descrizione}, ${riga.unita}, ${riga.quantita},
            ${riga.materiale}, ${riga.lavorazione}, ${riga.costoUnitario}, ${riga.note},
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `;
      }
    }

    return id;
  });
}

export async function cambiaStatoCommessa(
  tenantId: string,
  id: string,
  nuovoStato: StatoCommessa,
) {
  const commessa = await db.$queryRaw<Array<{ id: string; stato: StatoCommessa }>>`
    SELECT "id", "stato" FROM "commessa"
    WHERE "id" = ${id} AND "tenantId" = ${tenantId}
    LIMIT 1
  `;
  if (!commessa[0]) throw new Error('Commessa non trovata.');
  if (!transizioneCommessaAmmessa(commessa[0].stato, nuovoStato)) {
    throw new Error(`Transizione commessa non consentita: ${commessa[0].stato} → ${nuovoStato}.`);
  }

  const timestamp = new Date();
  const data = {
    avviataIl: nuovoStato === 'IN_PRODUZIONE' ? timestamp : null,
    prontaIl: nuovoStato === 'PRONTA' ? timestamp : null,
    consegnataIl: nuovoStato === 'CONSEGNATA' ? timestamp : null,
    chiusaIl: nuovoStato === 'CHIUSA' ? timestamp : null,
  };

  await db.$executeRaw`
    UPDATE "commessa"
    SET "stato" = ${nuovoStato},
        "avviataIl" = COALESCE("avviataIl", ${data.avviataIl}),
        "prontaIl" = COALESCE("prontaIl", ${data.prontaIl}),
        "consegnataIl" = COALESCE("consegnataIl", ${data.consegnataIl}),
        "chiusaIl" = COALESCE("chiusaIl", ${data.chiusaIl}),
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id} AND "tenantId" = ${tenantId}
  `;

  return dettaglioCommessa(tenantId, id);
}

export async function aggiornaDatiOperativiCommessa(
  tenantId: string,
  id: string,
  dataPrevistaConsegna: Date | null,
  noteProduzione: string | null,
) {
  const commessa = await db.$queryRaw<Array<{ stato: StatoCommessa }>>`
    SELECT "stato"
    FROM "commessa"
    WHERE "id" = ${id} AND "tenantId" = ${tenantId}
    LIMIT 1
  `;

  if (!commessa[0]) throw new Error('Commessa non trovata.');
  if (['CONSEGNATA', 'CHIUSA', 'ANNULLATA'].includes(commessa[0].stato)) {
    throw new Error('I dati operativi non sono modificabili dopo la consegna o la chiusura della commessa.');
  }

  await db.$executeRaw`
    UPDATE "commessa"
    SET "dataPrevistaConsegna" = ${dataPrevistaConsegna},
        "noteProduzione" = ${noteProduzione},
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${id} AND "tenantId" = ${tenantId}
  `;

  return dettaglioCommessa(tenantId, id);
}
