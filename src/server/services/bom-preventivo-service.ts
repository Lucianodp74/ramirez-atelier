import { dettaglioBom } from '@/server/services/bom-service';
import { db } from '@/server/db';
import { calcolaPrezzoBom, type BomPrezzoInput, type BomPrezzoSummary } from '@/server/services/bom-pricing-service';

export type PreventivoBomSnapshot = {
  bomId: string;
  richiestaId: string;
  versioneBom: number;
  statoBom: 'BOZZA' | 'CONFERMATA' | 'CHIUSA';
  costoProduzione: number;
  prezzo: BomPrezzoSummary;
  righe: Array<{ id: string; categoria: string; codice: string | null; descrizione: string; unita: string; quantita: number; costoUnitario: number | null; totaleCosto: number | null }>;
};

export type PreventivoSalvato = {
  versione: number;
  salvatoIl: string;
  bomId: string;
  bomVersione: number;
  pricing: BomPrezzoInput;
  prezzo: BomPrezzoSummary;
};

export type PreventivoStorico = PreventivoSalvato;

export async function preparaSnapshotPreventivoBom(tenantId: string, bomId: string, pricing: BomPrezzoInput = {}): Promise<PreventivoBomSnapshot | null> {
  const bom = await dettaglioBom(tenantId, bomId);
  if (!bom) return null;
  if (bom.stato === 'BOZZA') throw new Error('La BOM deve essere confermata prima di generare un preventivo.');

  const righe = bom.righe.map((riga) => ({
    id: riga.id, categoria: riga.categoria, codice: riga.codice, descrizione: riga.descrizione,
    unita: riga.unita, quantita: riga.quantita, costoUnitario: riga.costoUnitario,
    totaleCosto: riga.costoUnitario === null ? null : riga.quantita * riga.costoUnitario,
  }));
  if (righe.some((riga) => riga.costoUnitario === null || !Number.isFinite(riga.costoUnitario))) {
    throw new Error('Tutte le righe BOM devono avere un costo unitario prima del preventivo.');
  }
  const costoProduzione = righe.reduce((totale, riga) => totale + (riga.totaleCosto ?? 0), 0);
  return { bomId: bom.id, richiestaId: bom.richiestaId, versioneBom: bom.versione, statoBom: bom.stato, costoProduzione, prezzo: calcolaPrezzoBom(costoProduzione, pricing), righe };
}

/** Salva lo snapshot commerciale corrente e conserva tutte le versioni precedenti. */
export async function salvaPreventivoBom(tenantId: string, bomId: string, pricing: BomPrezzoInput = {}): Promise<PreventivoSalvato> {
  const snapshot = await preparaSnapshotPreventivoBom(tenantId, bomId, pricing);
  if (!snapshot) throw new Error('Distinta non trovata.');
  const richiesta = await db.richiestaProgetto.findUnique({ where: { id: snapshot.richiestaId }, select: { id: true, tenantId: true, datiEstensione: true } });
  if (!richiesta || richiesta.tenantId !== tenantId) throw new Error('Richiesta non trovata.');

  const estensione = richiesta.datiEstensione && typeof richiesta.datiEstensione === 'object' ? (richiesta.datiEstensione as Record<string, unknown>) : {};
  const precedente = estensione.preventivo && typeof estensione.preventivo === 'object' ? (estensione.preventivo as PreventivoSalvato) : null;
  const storicoPrecedente = Array.isArray(estensione.preventiviStorico)
    ? estensione.preventiviStorico.filter((item): item is PreventivoStorico => Boolean(item && typeof item === 'object'))
    : [];
  const storico = [...storicoPrecedente];
  if (precedente && !storico.some((item) => item.versione === precedente.versione)) storico.push(precedente);
  const ultimaVersione = storico.reduce((massima, item) => Number.isInteger(item.versione) ? Math.max(massima, item.versione) : massima, 0);
  const preventivo: PreventivoSalvato = {
    versione: ultimaVersione + 1,
    salvatoIl: new Date().toISOString(),
    bomId: snapshot.bomId,
    bomVersione: snapshot.versioneBom,
    pricing,
    prezzo: snapshot.prezzo,
  };
  storico.push(preventivo);

  await db.richiestaProgetto.update({
    where: { id: richiesta.id },
    data: { datiEstensione: { ...estensione, preventivo, preventiviStorico: storico } },
  });
  return preventivo;
}

export async function ultimoPreventivoBom(tenantId: string, bomId: string): Promise<PreventivoSalvato | null> {
  const bom = await dettaglioBom(tenantId, bomId);
  if (!bom) return null;
  const richiesta = await db.richiestaProgetto.findUnique({ where: { id: bom.richiestaId }, select: { tenantId: true, datiEstensione: true } });
  if (!richiesta || richiesta.tenantId !== tenantId) return null;
  const estensione = richiesta.datiEstensione;
  if (!estensione || typeof estensione !== 'object') return null;
  const preventivo = (estensione as Record<string, unknown>).preventivo;
  if (!preventivo || typeof preventivo !== 'object') return null;
  return preventivo as PreventivoSalvato;
}
