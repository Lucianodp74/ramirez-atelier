import { Prisma } from '@prisma/client';
import { db } from '@/server/db';

export type StatoBom = 'BOZZA' | 'CONFERMATA' | 'CHIUSA';

export interface CreaBomInput {
  richiestaId: string;
  noteProduzione?: string | null;
}

export interface BomAttore {
  utenteId: string;
  membershipId: string;
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
  codice?: string | null;
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

export type BomPrezzoStorico = {
  id: string;
  bomRigaId: string;
  costoPrecedente: number | null;
  costoNuovo: number | null;
  tipo: 'INSERIMENTO' | 'MODIFICA';
  utenteId: string | null;
  membershipId: string | null;
  createdAt: Date;
};

export type BomPropostaRisultato = {
  bomId: string;
  create: boolean;
  righeAggiunte: number;
  avvertenze: string[];
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

/**
 * Genera una prima distinta tecnica modificabile a partire dai dati dichiarati
 * nella richiesta. I costi arrivano sempre dal Listino Ramirez attivo; la
 * struttura e le quantità sono una proposta preliminare, mai una BOM esecutiva.
 */
export async function generaPropostaBom(tenantId: string, richiestaId: string): Promise<BomPropostaRisultato> {
  const richiesta = await db.richiestaProgetto.findFirst({
    where: { id: richiestaId, tenantId },
    select: {
      id: true,
      tipoProgetto: { select: { chiave: true, nome: true } },
      datiFormJson: true,
      messaggioLibero: true,
    },
  });
  if (!richiesta) throw new Error('Richiesta non trovata.');

  const bomId = await creaBom(tenantId, {
    richiestaId,
    noteProduzione: 'BOM proposta generata dal configuratore. Verificare dimensioni, ferramenta, quantità e lavorazioni prima della conferma.',
  });
  const esistente = await dettaglioBom(tenantId, bomId);
  if (!esistente) throw new Error('Distinta non trovata dopo la creazione.');
  if (esistente.stato !== 'BOZZA') throw new Error('La distinta non è più modificabile.');
  if (esistente.righe.length > 0) {
    return { bomId, create: false, righeAggiunte: 0, avvertenze: ['La BOM esistente contiene già righe: nessuna riga è stata duplicata.'] };
  }

  const form = richiesta.datiFormJson && typeof richiesta.datiFormJson === 'object'
    ? (richiesta.datiFormJson as Record<string, unknown>)
    : {};
  const testo = `${richiesta.tipoProgetto.chiave} ${richiesta.tipoProgetto.nome} ${richiesta.messaggioLibero ?? ''}`.toLowerCase();
  const isArmadio = /armadio|guardaroba|cabina/.test(testo);
  const isCucina = /cucina/.test(testo);
  const isLibreria = /libreria/.test(testo);
  const isBagno = /bagno/.test(testo);

  const larghezza = numero(form.larghezzaCm);
  const altezza = numero(form.altezzaCm);
  const profondita = numero(form.profonditaCm) ?? (isArmadio ? 60 : null);
  const materialeScelto = String(form.materiale ?? '').toLowerCase();

  const template = isArmadio ? 'armadio' : isCucina ? 'cucina' : isLibreria ? 'libreria' : isBagno ? 'bagno' : 'generico';
  const dimensioniNote = [
    larghezza ? `L ${larghezza} cm` : null,
    altezza ? `H ${altezza} cm` : null,
    profondita ? `P ${profondita} cm` : null,
  ].filter(Boolean).join(' × ');

  const avvertenze: string[] = [
    'Proposta preliminare: controllare misure reali, sezioni, ferramenta e lavorazioni prima di confermare la BOM.',
  ];
  if (!larghezza || !altezza) avvertenze.push('Mancano larghezza e/o altezza: le quantità dimensionali sono state impostate su un minimo prudenziale.');
  if (profondita == null) avvertenze.push('Profondità non dichiarata: da definire in fase tecnica.');

  const codici = ['MAT-TRUCIOLARE', 'MAT-MDF', 'MAT-MULTISTRATO', 'FIN-MELAMINICO', 'FIN-LAMINATO', 'FIN-LACCATO', 'SERV-BORDO-ML', 'MAT-RETRO-M2', 'FER-PORTA', 'FER-CASSETTO', 'MAN-COSTO-ORA'];
  const listino = await db.$queryRaw<Array<{ codice: string; nome: string; tipo: string; unita: string; prezzo: number; materiale: string | null }>>`
    SELECT "codice", "nome", "tipo", "unita", "prezzo"::float8 AS "prezzo", "materiale"
    FROM "listino_prezzo"
    WHERE "tenantId" = ${tenantId} AND "attivo" = true AND "codice" IN (${Prisma.join(codici)})
  `;
  const byCode = new Map(listino.map((item) => [item.codice, item]));

  const superficie = Math.max(((larghezza ?? 100) * (altezza ?? 200)) / 10000, 1);
  const superficieMateriale = round(Math.max(superficie * (template === 'libreria' ? 1.5 : 1.8), 1));
  const superficieFinitura = round(Math.max(superficie * 1.2, 1));
  const superficieRetro = round(Math.max(superficie, 1));
  const bordaturaMl = round(Math.max((((larghezza ?? 100) + (altezza ?? 200)) * 2) / 100 * 1.2, 2));
  const porte = template === 'armadio' ? (larghezza != null && larghezza <= 80 ? 1 : 2) : template === 'cucina' ? 4 : 0;
  const cassetti = /cassetti|cassetto/.test(testo) ? 2 : template === 'cucina' ? 3 : 0;
  const ripiani = template === 'libreria' ? 6 : template === 'armadio' ? 4 : 0;

  const codiceMateriale = materialeScelto.includes('laccato')
    ? 'MAT-MDF'
    : materialeScelto.includes('multistrato')
      ? 'MAT-MULTISTRATO'
      : 'MAT-TRUCIOLARE';
  const codiceFinitura = materialeScelto.includes('laccato')
    ? 'FIN-LACCATO'
    : materialeScelto.includes('laminato')
      ? 'FIN-LAMINATO'
      : 'FIN-MELAMINICO';

  const righe: CreaBomRigaInput[] = [];
  aggiungiSeDisponibile(righe, byCode, codiceMateriale, superficieMateriale, `Struttura ${template} — ${dimensioniNote || 'dimensioni da definire'}`, 'MATERIALE', materialeListino(byCode.get(codiceMateriale)), 'Taglio e preparazione pannelli', 'Quantità preliminare con maggiorazione per struttura e sfrido.');
  aggiungiSeDisponibile(righe, byCode, codiceFinitura, superficieFinitura, `Finitura ${materialeScelto || 'da definire'}`, 'COMPONENTE', byCode.get(codiceFinitura)?.materiale ?? null, 'Applicazione finitura', 'Finitura dedotta dalla scelta cliente; verificare supporto e ciclo.');
  aggiungiSeDisponibile(righe, byCode, 'MAT-RETRO-M2', superficieRetro, 'Schienale / retro', 'MATERIALE', byCode.get('MAT-RETRO-M2')?.materiale ?? null, 'Taglio', 'Quantità preliminare.');
  aggiungiSeDisponibile(righe, byCode, 'SERV-BORDO-ML', bordaturaMl, 'Bordatura pannelli', 'COMPONENTE', byCode.get('SERV-BORDO-ML')?.materiale ?? null, 'Bordatura', 'Sviluppo preliminare dei bordi.');
  if (porte > 0) aggiungiSeDisponibile(righe, byCode, 'FER-PORTA', porte, `Ferramenta porte (${porte} ante)`, 'FERRAMENTA', byCode.get('FER-PORTA')?.materiale ?? null, 'Montaggio ferramenta', 'Numero ante proposto automaticamente: verificare con il disegno tecnico.');
  if (cassetti > 0) aggiungiSeDisponibile(righe, byCode, 'FER-CASSETTO', cassetti, `Ferramenta cassetti (${cassetti})`, 'FERRAMENTA', byCode.get('FER-CASSETTO')?.materiale ?? null, 'Montaggio ferramenta', 'Numero cassetti dedotto dalla descrizione; verificare con il progetto definitivo.');

  const oreBase = 0.8;
  const oreM2 = 0.9 * superficie;
  const orePorte = 0.35 * porte;
  const oreCassetti = 0.5 * cassetti;
  const oreRipiani = 0.12 * ripiani;
  const oreTotali = round(oreBase + oreM2 + orePorte + oreCassetti + oreRipiani);
  const costoOra = byCode.get('MAN-COSTO-ORA');
  if (costoOra) {
    righe.push({
      categoria: 'LAVORAZIONE',
      codice: 'MAN-COSTO-ORA',
      descrizione: 'Manodopera stimata',
      unita: 'H',
      quantita: oreTotali,
      materiale: null,
      lavorazione: 'Produzione / assemblaggio',
      costoUnitario: costoOra.prezzo,
      note: `Stima tecnica: ${oreTotali} h (base + superficie + porte + cassetti + ripiani).`,
    });
  } else {
    avvertenze.push('Voce MAN-COSTO-ORA non presente nel Listino attivo: la manodopera non è stata valorizzata.');
  }

  let righeAggiunte = 0;
  for (const [indice, riga] of righe.entries()) {
    await aggiungiRigaBom(tenantId, bomId, { ...riga, ordinamento: indice });
    righeAggiunte += 1;
  }

  if (template === 'generico') avvertenze.push('Tipo di lavoro non riconosciuto con precisione: è stata generata una base BOM generica da adattare.');
  return { bomId, create: true, righeAggiunte, avvertenze };
}

function numero(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace(',', '.'));
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

function materialeListino(voce: { materiale: string | null } | undefined) {
  return voce?.materiale ?? null;
}

function aggiungiSeDisponibile(
  righe: CreaBomRigaInput[],
  byCode: Map<string, { codice: string; nome: string; tipo: string; unita: string; prezzo: number; materiale: string | null }>,
  codice: string,
  quantita: number,
  descrizione: string,
  categoria: string,
  materiale: string | null,
  lavorazione: string,
  note: string,
) {
  const voce = byCode.get(codice);
  if (!voce) return;
  righe.push({
    categoria,
    codice,
    descrizione,
    unita: voce.unita,
    quantita: round(quantita),
    materiale,
    lavorazione,
    costoUnitario: voce.prezzo,
    note,
  });
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

export async function aggiungiRigaBom(
  tenantId: string,
  bomId: string,
  input: CreaBomRigaInput,
  attore?: BomAttore,
) {
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

  if (input.costoUnitario != null) {
    await registraStoricoPrezzo(tenantId, bomId, id, null, input.costoUnitario, 'INSERIMENTO', attore);
  }
  return id;
}

export async function aggiornaRigaBom(
  tenantId: string,
  rigaId: string,
  input: AggiornaBomRigaInput,
  attore?: BomAttore,
) {
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

  const costoNuovo = input.costoUnitario !== undefined ? input.costoUnitario : existing.costoUnitario;
  const costoCambiato = input.costoUnitario !== undefined && input.costoUnitario !== existing.costoUnitario;

  await db.$executeRaw`
    UPDATE "bom_riga"
    SET "categoria" = ${input.categoria ?? existing.categoria},
        "codice" = ${input.codice !== undefined ? input.codice : existing.codice},
        "descrizione" = ${input.descrizione ?? existing.descrizione},
        "unita" = ${input.unita ?? existing.unita},
        "quantita" = ${input.quantita ?? existing.quantita},
        "materiale" = ${input.materiale !== undefined ? input.materiale : existing.materiale},
        "lavorazione" = ${input.lavorazione !== undefined ? input.lavorazione : existing.lavorazione},
        "costoUnitario" = ${costoNuovo},
        "note" = ${input.note !== undefined ? input.note : existing.note},
        "updatedAt" = CURRENT_TIMESTAMP
    WHERE "id" = ${rigaId}
  `;

  if (costoCambiato) {
    await registraStoricoPrezzo(tenantId, riga[0].bomId, rigaId, existing.costoUnitario, costoNuovo, 'MODIFICA', attore);
  }
}

export async function storicoPrezzoBomRiga(
  tenantId: string,
  rigaId: string,
): Promise<BomPrezzoStorico[]> {
  const rows = await db.$queryRaw<BomPrezzoStorico[]>`
    SELECT h."id", h."bomRigaId", h."costoPrecedente", h."costoNuovo", h."tipo", h."utenteId", h."membershipId", h."createdAt"
    FROM "bom_riga_prezzo_storico" h
    JOIN "bom" b ON b."id" = h."bomId"
    WHERE h."tenantId" = ${tenantId} AND h."bomRigaId" = ${rigaId}
    ORDER BY h."createdAt" DESC
  `;
  return rows;
}

async function registraStoricoPrezzo(
  tenantId: string,
  bomId: string,
  bomRigaId: string,
  costoPrecedente: number | null,
  costoNuovo: number | null,
  tipo: 'INSERIMENTO' | 'MODIFICA',
  attore?: BomAttore,
) {
  await db.$executeRaw`
    INSERT INTO "bom_riga_prezzo_storico" ("id", "tenantId", "bomId", "bomRigaId", "costoPrecedente", "costoNuovo", "tipo", "utenteId", "membershipId", "createdAt")
    VALUES (${crypto.randomUUID()}, ${tenantId}, ${bomId}, ${bomRigaId}, ${costoPrecedente}, ${costoNuovo}, ${tipo}, ${attore?.utenteId ?? null}, ${attore?.membershipId ?? null}, CURRENT_TIMESTAMP)
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
