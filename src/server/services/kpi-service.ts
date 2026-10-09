import { db } from '@/server/db';
import { STATI_OPERATIVI } from '@/lib/workflow';

export interface FiltriKpi {
  dataDa?: string;
  dataA?: string;
}

export interface RiepilogoKpi {
  valoreOpportunitaAperte: { valore: number; disponibile: boolean };
  valoreMedioRichiesta: { valore: number; disponibile: boolean };
  tempoMedioRichiestaPreventivoGiorni: { valore: number; disponibile: boolean; campione: number };
  tassoConversione: { percentuale: number; convertite: number; totale: number };
  richiestePerTipologia: Array<{ nome: string; conteggio: number }>;
  richiestePerArchitetto: Array<{
    nome: string;
    email: string | null;
    conteggio: number;
    valoreTotale: number;
  }>;
  distribuzionePerFasciaBudget: Array<{ nome: string; conteggio: number }>;
  produzione: {
    commesseTotali: number;
    commesseAperte: number;
    commesseChiuse: number;
    costoProduzioneTotale: number;
    costoProduzioneMedio: number;
    tempoMedioProduzioneGiorni: { valore: number; disponibile: boolean; campione: number };
    puntualitaConsegne: { percentuale: number; puntuali: number; campione: number };
    margineLordo: { totale: number; medio: number; disponibile: boolean; campione: number };
  };
}

const STATI_APERTI = ['NUOVA', 'IN_REVISIONE', 'PREVENTIVO_INVIATO'] as const;

/**
 * Calcola tutte le metriche aggregando le righe esistenti in memoria (non SQL
 * aggregato): scelta deliberata, non un compromesso di fretta - ai volumi di
 * una singola azienda artigiana (decine/centinaia di richieste, non milioni)
 * è la soluzione più semplice che funziona, ed è più facile da verificare
 * riga per riga. Il giorno in cui i volumi lo richiederanno, questa funzione
 * sarà il punto naturale da sostituire con query aggregate lato database -
 * non prima, per non ottimizzare un problema che non esiste ancora.
 */
export async function calcolaKpi(tenantId: string, filtri: FiltriKpi = {}): Promise<RiepilogoKpi> {
  // dataA è inclusiva: trasformiamo la data selezionata nell'inizio del giorno
  // successivo e usiamo lt, così includiamo tutte le ore del giorno finale.
  const dataAEsclusiva = filtri.dataA ? new Date(filtri.dataA) : null;
  if (dataAEsclusiva) dataAEsclusiva.setUTCDate(dataAEsclusiva.getUTCDate() + 1);

  const where: Record<string, unknown> = { tenantId, stato: { in: STATI_OPERATIVI } };
  if (filtri.dataDa || filtri.dataA) {
    where.createdAt = {
      ...(filtri.dataDa ? { gte: new Date(filtri.dataDa) } : {}),
      ...(dataAEsclusiva ? { lt: dataAEsclusiva } : {}),
    };
  }

  const richieste = await db.richiestaProgetto.findMany({
    where,
    include: { tipoProgetto: true, fasciaBudget: true },
  });

  // --- Valore opportunità aperte e valore medio ---
  // I campi @db.Decimal dello schema (fasciaPrezzoMin/Max) arrivano dal client
  // Prisma reale come istanze di Decimal, non come number semplici - Number(x)
  // le converte correttamente (stessa raccomandazione della documentazione Prisma).
  const midpoint = (min: unknown, max: unknown) =>
    min !== null && min !== undefined && max !== null && max !== undefined
      ? (Number(min) + Number(max)) / 2
      : null;

  const aperteConPrezzo = richieste.filter(
    (r) =>
      (STATI_APERTI as readonly string[]).includes(r.stato) &&
      midpoint(r.fasciaPrezzoMin, r.fasciaPrezzoMax) !== null,
  );
  const valoreOpportunitaAperte = aperteConPrezzo.reduce(
    (acc, r) => acc + (midpoint(r.fasciaPrezzoMin, r.fasciaPrezzoMax) ?? 0),
    0,
  );

  const tutteConPrezzo = richieste.filter(
    (r) => midpoint(r.fasciaPrezzoMin, r.fasciaPrezzoMax) !== null,
  );
  const valoreMedioRichiesta =
    tutteConPrezzo.length > 0
      ? tutteConPrezzo.reduce(
          (acc, r) => acc + (midpoint(r.fasciaPrezzoMin, r.fasciaPrezzoMax) ?? 0),
          0,
        ) / tutteConPrezzo.length
      : 0;

  // --- Tempo medio richiesta -> preventivo inviato ---
  // Usa il momento reale in cui lo stato è passato a PREVENTIVO_INVIATO (un'azione
  // umana tracciata in EventoAttivita), non l'istante della stima automatica -
  // misura la reattività del team, non la velocità del motore di pricing.
  const idRichiesteRilevanti = richieste.map((r) => r.id);
  const tempiRisposta: number[] = [];
  for (const id of idRichiesteRilevanti) {
    const eventi = await db.eventoAttivita.findMany({
      where: { richiestaId: id },
      orderBy: { createdAt: 'asc' },
    });
    const eventoPreventivo = eventi.find(
      (e) =>
        e.tipo === 'STATO_MODIFICATO' &&
        (e.metadatiJson as Record<string, unknown> | null)?.statoNuovo === 'PREVENTIVO_INVIATO',
    );
    if (eventoPreventivo) {
      const richiesta = richieste.find((r) => r.id === id)!;
      const giorni =
        (new Date(eventoPreventivo.createdAt).getTime() - new Date(richiesta.createdAt).getTime()) /
        (1000 * 60 * 60 * 24);
      tempiRisposta.push(giorni);
    }
  }
  const tempoMedioGiorni =
    tempiRisposta.length > 0 ? tempiRisposta.reduce((a, b) => a + b, 0) / tempiRisposta.length : 0;

  // --- Tasso di conversione ---
  // Bug reale trovato in verifica: contare solo lo stato ATTUALE sottostima le
  // conversioni, perché il workflow permette di archiviare una richiesta già
  // convertita a CHIUSA (v. src/lib/workflow.ts) - a quel punto il suo stato
  // corrente non è più CONVERTITA, ma è comunque stata una vendita. Si verifica
  // quindi se CONVERTITA compare MAI nella cronologia degli eventi, non lo
  // stato istantaneo.
  let convertite = 0;
  for (const r of richieste) {
    if (r.stato === 'CONVERTITA') {
      convertite++;
      continue;
    }
    const eventi = await db.eventoAttivita.findMany({ where: { richiestaId: r.id } });
    const eStataConvertita = eventi.some(
      (e) =>
        e.tipo === 'STATO_MODIFICATO' &&
        (e.metadatiJson as Record<string, unknown> | null)?.statoNuovo === 'CONVERTITA',
    );
    if (eStataConvertita) convertite++;
  }
  const tassoConversione = richieste.length > 0 ? (convertite / richieste.length) * 100 : 0;

  // --- Richieste per tipologia ---
  const mappaTipologia = new Map<string, number>();
  for (const r of richieste) {
    const nome = r.tipoProgetto?.nome ?? 'Sconosciuto';
    mappaTipologia.set(nome, (mappaTipologia.get(nome) ?? 0) + 1);
  }
  const richiestePerTipologia = [...mappaTipologia.entries()]
    .map(([nome, conteggio]) => ({ nome, conteggio }))
    .sort((a, b) => b.conteggio - a.conteggio);

  // --- Richieste per architetto ---
  // Nota di scope: non esiste ancora un'identità "Architetto" reale (ADR-0004
  // §8 la prevede come futura IdentitaEsterna, non implementata) - approssimata
  // qui raggruppando per nome+email tra i clienti con clienteTipo=ARCHITETTO.
  const architetti = richieste.filter((r) => r.clienteTipo === 'ARCHITETTO');
  const mappaArchitetti = new Map<
    string,
    { nome: string; email: string | null; conteggio: number; valoreTotale: number }
  >();
  for (const r of architetti) {
    const chiave = `${r.clienteNome ?? ''}|${r.clienteEmail ?? ''}`;
    const esistente = mappaArchitetti.get(chiave);
    const valore = midpoint(r.fasciaPrezzoMin, r.fasciaPrezzoMax) ?? 0;
    if (esistente) {
      esistente.conteggio += 1;
      esistente.valoreTotale += valore;
    } else {
      mappaArchitetti.set(chiave, {
        nome: r.clienteNome ?? 'Senza nome',
        email: r.clienteEmail,
        conteggio: 1,
        valoreTotale: valore,
      });
    }
  }
  const richiestePerArchitetto = [...mappaArchitetti.values()].sort(
    (a, b) => b.conteggio - a.conteggio,
  );

  // --- Distribuzione per fascia di budget dichiarata ---
  const fasceOrdinate = await db.fasciaBudget.findMany({
    where: { tenantId },
    orderBy: { ordinamento: 'asc' },
  });
  const mappaFasce = new Map<string, number>();
  for (const r of richieste) {
    const nome = r.fasciaBudget?.nome ?? 'Non indicata';
    mappaFasce.set(nome, (mappaFasce.get(nome) ?? 0) + 1);
  }
  const ordineNomi = [...fasceOrdinate.map((f) => f.nome), 'Non indicata'];
  const distribuzionePerFasciaBudget = ordineNomi
    .filter((nome) => mappaFasce.has(nome))
    .map((nome) => ({ nome, conteggio: mappaFasce.get(nome)! }));

  // --- Produzione ed economia delle commesse ---
  // La commessa conserva lo snapshot della BOM: il costo non viene ricalcolato
  // con il Listino corrente. Il margine usa esclusivamente un preventivo
  // commerciale realmente salvato sulla richiesta/BOM e l'imponibile, quindi
  // esclude l'IVA. La stima indicativa del Preventivatore non viene trattata
  // come prezzo di vendita definitivo.
  const commesse = await db.$queryRaw<Array<{
    id: string;
    stato: string;
    avviataIl: Date | null;
    prontaIl: Date | null;
    consegnataIl: Date | null;
    dataPrevistaConsegna: Date | null;
    datiEstensione: unknown;
  }>>`
    SELECT c."id", c."stato", c."avviataIl", c."prontaIl", c."consegnataIl",
           c."dataPrevistaConsegna", r."datiEstensione"
    FROM "commessa" c
    JOIN "richiesta_progetto" r ON r."id" = c."richiestaId"
    WHERE c."tenantId" = ${tenantId}
      AND (${filtri.dataDa ? new Date(filtri.dataDa) : null}::timestamp IS NULL OR c."createdAt" >= ${filtri.dataDa ? new Date(filtri.dataDa) : null})
      AND (${dataAEsclusiva}::timestamp IS NULL OR c."createdAt" < ${dataAEsclusiva})
  `;

  const righeCommessa = await db.$queryRaw<Array<{ commessaId: string; quantita: number; costoUnitario: number | null }>>`
    SELECT cr."commessaId", cr."quantita"::float8 AS "quantita", cr."costoUnitario"::float8 AS "costoUnitario"
    FROM "commessa_riga_produzione" cr
    JOIN "commessa" c ON c."id" = cr."commessaId"
    WHERE cr."tenantId" = ${tenantId}
      AND (${filtri.dataDa ? new Date(filtri.dataDa) : null}::timestamp IS NULL OR c."createdAt" >= ${filtri.dataDa ? new Date(filtri.dataDa) : null})
      AND (${dataAEsclusiva}::timestamp IS NULL OR c."createdAt" < ${dataAEsclusiva})
  `;
  const costiPerCommessa = new Map<string, number>();
  for (const riga of righeCommessa) {
    if (riga.costoUnitario != null && Number.isFinite(Number(riga.costoUnitario))) {
      costiPerCommessa.set(riga.commessaId, (costiPerCommessa.get(riga.commessaId) ?? 0) + Number(riga.quantita) * Number(riga.costoUnitario));
    }
  }

  const costoProduzioneTotale = commesse.reduce((totale, c) => totale + (costiPerCommessa.get(c.id) ?? 0), 0);
  const commesseConCosto = commesse.filter((c) => costiPerCommessa.has(c.id));
  const tempoProduzione = commesse
    .filter((c) => c.avviataIl && c.prontaIl)
    .map((c) => (new Date(c.prontaIl!).getTime() - new Date(c.avviataIl!).getTime()) / 86400000)
    .filter((giorni) => giorni >= 0);
  const consegneConData = commesse.filter((c) => c.consegnataIl && c.dataPrevistaConsegna);
  const puntuali = consegneConData.filter((c) => new Date(c.consegnataIl!).getTime() <= new Date(c.dataPrevistaConsegna!).getTime()).length;

  const margini: number[] = [];
  for (const commessa of commesse) {
    if (!costiPerCommessa.has(commessa.id) || !commessa.datiEstensione || typeof commessa.datiEstensione !== 'object' || Array.isArray(commessa.datiEstensione)) continue;
    const estensione = commessa.datiEstensione as Record<string, unknown>;
    const preventivo = estensione.preventivo;
    if (!preventivo || typeof preventivo !== 'object' || Array.isArray(preventivo)) continue;
    const prezzo = (preventivo as Record<string, unknown>).prezzo;
    if (!prezzo || typeof prezzo !== 'object' || Array.isArray(prezzo)) continue;
    const imponibile = (prezzo as Record<string, unknown>).imponibile;
    if (typeof imponibile !== 'number' || !Number.isFinite(imponibile)) continue;
    margini.push(imponibile - (costiPerCommessa.get(commessa.id) ?? 0));
  }

  const produzione = {
    commesseTotali: commesse.length,
    commesseAperte: commesse.filter((c) => ['DA_AVVIARE', 'IN_PRODUZIONE', 'PRONTA'].includes(c.stato)).length,
    commesseChiuse: commesse.filter((c) => c.stato === 'CHIUSA').length,
    costoProduzioneTotale,
    costoProduzioneMedio: commesseConCosto.length > 0 ? costoProduzioneTotale / commesseConCosto.length : 0,
    tempoMedioProduzioneGiorni: {
      valore: tempoProduzione.length > 0 ? Math.round((tempoProduzione.reduce((a, b) => a + b, 0) / tempoProduzione.length) * 10) / 10 : 0,
      disponibile: tempoProduzione.length > 0,
      campione: tempoProduzione.length,
    },
    puntualitaConsegne: {
      percentuale: consegneConData.length > 0 ? Math.round((puntuali / consegneConData.length) * 1000) / 10 : 0,
      puntuali,
      campione: consegneConData.length,
    },
    margineLordo: {
      totale: margini.reduce((a, b) => a + b, 0),
      medio: margini.length > 0 ? margini.reduce((a, b) => a + b, 0) / margini.length : 0,
      disponibile: margini.length > 0,
      campione: margini.length,
    },
  };

  return {
    valoreOpportunitaAperte: {
      valore: valoreOpportunitaAperte,
      disponibile: aperteConPrezzo.length > 0,
    },
    valoreMedioRichiesta: { valore: valoreMedioRichiesta, disponibile: tutteConPrezzo.length > 0 },
    tempoMedioRichiestaPreventivoGiorni: {
      valore: Math.round(tempoMedioGiorni * 10) / 10,
      disponibile: tempiRisposta.length > 0,
      campione: tempiRisposta.length,
    },
    tassoConversione: {
      percentuale: Math.round(tassoConversione * 10) / 10,
      convertite,
      totale: richieste.length,
    },
    richiestePerTipologia,
    richiestePerArchitetto,
    distribuzionePerFasciaBudget,
    produzione,
  };
}
