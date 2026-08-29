import { dettaglioBom } from '@/server/services/bom-service';

export type BomCostoCategoria = {
  categoria: string;
  totale: number;
  righe: number;
};

export type BomCostoSummary = {
  righeConCosto: number;
  righeSenzaCosto: number;
  subtotale: number;
  categorie: BomCostoCategoria[];
  completo: boolean;
};

export type BomPrezzoInput = {
  ricaricoPercentuale?: number;
  costiFissi?: number;
  lavorazioni?: number;
  manodopera?: number;
  spese?: number;
  scontoPercentuale?: number;
  ivaPercentuale?: number;
};

export type BomPrezzoSummary = {
  costoProduzione: number;
  costiFissi: number;
  lavorazioni: number;
  manodopera: number;
  spese: number;
  costiAggiuntivi: number;
  baseConRicarico: number;
  sconto: number;
  imponibile: number;
  iva: number;
  totale: number;
  ricaricoPercentuale: number;
  scontoPercentuale: number;
  ivaPercentuale: number;
};

function percentualeValida(nome: string, valore: number) {
  if (!Number.isFinite(valore) || valore < 0 || valore > 100) {
    throw new Error(`${nome} deve essere compresa tra 0 e 100.`);
  }
}

function importoValido(nome: string, valore: number) {
  if (!Number.isFinite(valore) || valore < 0) {
    throw new Error(`${nome} deve essere maggiore o uguale a zero.`);
  }
}

/**
 * Primo livello del pricing engine: calcola il costo osservato dalle righe BOM
 * che hanno un costo unitario esplicito.
 */
export async function riepilogoCostoBom(
  tenantId: string,
  bomId: string,
): Promise<BomCostoSummary | null> {
  const bom = await dettaglioBom(tenantId, bomId);
  if (!bom) return null;

  const categorie = new Map<string, { totale: number; righe: number }>();
  let subtotale = 0;
  let righeConCosto = 0;
  let righeSenzaCosto = 0;

  for (const riga of bom.righe) {
    if (riga.costoUnitario === null || !Number.isFinite(riga.costoUnitario)) {
      righeSenzaCosto += 1;
      continue;
    }

    const totale = riga.quantita * riga.costoUnitario;
    subtotale += totale;
    righeConCosto += 1;

    const corrente = categorie.get(riga.categoria) ?? { totale: 0, righe: 0 };
    corrente.totale += totale;
    corrente.righe += 1;
    categorie.set(riga.categoria, corrente);
  }

  return {
    righeConCosto,
    righeSenzaCosto,
    subtotale,
    categorie: [...categorie.entries()]
      .map(([categoria, valore]) => ({ categoria, ...valore }))
      .sort((a, b) => b.totale - a.totale),
    completo: bom.righe.length > 0 && righeSenzaCosto === 0,
  };
}

/**
 * Calcola il prezzo commerciale a partire dal costo BOM e da costi aggiuntivi
 * espliciti. `costiFissi` resta supportato per compatibilità con il pricing v0.
 * Tutti i valori economici hanno default zero: nessun prezzo viene inventato.
 */
export function calcolaPrezzoBom(
  costoProduzione: number,
  input: BomPrezzoInput = {},
): BomPrezzoSummary {
  importoValido('Il costo di produzione', costoProduzione);

  const ricaricoPercentuale = input.ricaricoPercentuale ?? 0;
  const costiFissi = input.costiFissi ?? 0;
  const lavorazioni = input.lavorazioni ?? 0;
  const manodopera = input.manodopera ?? 0;
  const spese = input.spese ?? 0;
  const scontoPercentuale = input.scontoPercentuale ?? 0;
  const ivaPercentuale = input.ivaPercentuale ?? 0;

  percentualeValida('Il ricarico', ricaricoPercentuale);
  importoValido('I costi fissi', costiFissi);
  importoValido('Le lavorazioni', lavorazioni);
  importoValido('La manodopera', manodopera);
  importoValido('Le spese', spese);
  percentualeValida('Lo sconto', scontoPercentuale);
  percentualeValida("L'IVA", ivaPercentuale);

  const costiAggiuntivi = costiFissi + lavorazioni + manodopera + spese;
  const baseConRicarico = (costoProduzione + costiAggiuntivi) * (1 + ricaricoPercentuale / 100);
  const sconto = baseConRicarico * (scontoPercentuale / 100);
  const imponibile = Math.max(0, baseConRicarico - sconto);
  const iva = imponibile * (ivaPercentuale / 100);
  const totale = imponibile + iva;

  return {
    costoProduzione,
    costiFissi,
    lavorazioni,
    manodopera,
    spese,
    costiAggiuntivi,
    baseConRicarico,
    sconto,
    imponibile,
    iva,
    totale,
    ricaricoPercentuale,
    scontoPercentuale,
    ivaPercentuale,
  };
}
