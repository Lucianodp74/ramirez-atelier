import { dettaglioBom } from '@/server/services/bom-service';
import {
  calcolaPrezzoBom,
  type BomPrezzoInput,
  type BomPrezzoSummary,
} from '@/server/services/bom-pricing-service';

export type PreventivoBomSnapshot = {
  bomId: string;
  richiestaId: string;
  versioneBom: number;
  statoBom: 'BOZZA' | 'CONFERMATA' | 'CHIUSA';
  costoProduzione: number;
  prezzo: BomPrezzoSummary;
  righe: Array<{
    id: string;
    categoria: string;
    codice: string | null;
    descrizione: string;
    unita: string;
    quantita: number;
    costoUnitario: number | null;
    totaleCosto: number | null;
  }>;
};

/**
 * Prepara lo snapshot economico da usare nella futura generazione del preventivo.
 * Non scrive ancora il preventivo: il modello storico del preventivo non è
 * presente nello schema corrente e non viene inventato in questa fase.
 *
 * Una BOM deve essere CONFERMATA o CHIUSA e completamente valorizzata prima
 * di poter diventare la base economica di un preventivo.
 */
export async function preparaSnapshotPreventivoBom(
  tenantId: string,
  bomId: string,
  pricing: BomPrezzoInput = {},
): Promise<PreventivoBomSnapshot | null> {
  const bom = await dettaglioBom(tenantId, bomId);
  if (!bom) return null;

  if (bom.stato === 'BOZZA') {
    throw new Error('La BOM deve essere confermata prima di generare un preventivo.');
  }

  const righe = bom.righe.map((riga) => ({
    id: riga.id,
    categoria: riga.categoria,
    codice: riga.codice,
    descrizione: riga.descrizione,
    unita: riga.unita,
    quantita: riga.quantita,
    costoUnitario: riga.costoUnitario,
    totaleCosto: riga.costoUnitario === null ? null : riga.quantita * riga.costoUnitario,
  }));

  if (righe.some((riga) => riga.costoUnitario === null || !Number.isFinite(riga.costoUnitario))) {
    throw new Error('Tutte le righe BOM devono avere un costo unitario prima del preventivo.');
  }

  const costoProduzione = righe.reduce((totale, riga) => totale + (riga.totaleCosto ?? 0), 0);

  return {
    bomId: bom.id,
    richiestaId: bom.richiestaId,
    versioneBom: bom.versione,
    statoBom: bom.stato,
    costoProduzione,
    prezzo: calcolaPrezzoBom(costoProduzione, pricing),
    righe,
  };
}
