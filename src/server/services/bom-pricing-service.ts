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

/**
 * Primo livello del pricing engine: calcola esclusivamente il costo osservato
 * dalle righe BOM che hanno un costo unitario esplicito.
 *
 * Non applica margini, ricarichi, IVA, sconti o prezzi inventati. Una BOM è
 * `completo` solo quando ogni riga possiede un costo unitario numerico.
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
