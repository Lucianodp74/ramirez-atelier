import { dettaglioBom } from '@/server/services/bom-service';
import { calcolaPrezzoBom, type BomPrezzoInput, type BomPrezzoSummary } from '@/lib/bom-pricing-calculation';
import { totaleRigaBomInCentesimi } from '@/lib/bom-totali';

export type BomCostoCategoria = { categoria: string; totale: number; righe: number };
export type BomCostoSummary = { righeConCosto: number; righeSenzaCosto: number; subtotale: number; categorie: BomCostoCategoria[]; completo: boolean };
export type { BomPrezzoInput, BomPrezzoSummary };

export async function riepilogoCostoBom(tenantId: string, bomId: string): Promise<BomCostoSummary | null> {
  const bom = await dettaglioBom(tenantId, bomId); if (!bom) return null;
  // Totali in centesimi, secondo la convenzione della BOM (totali di riga arrotondati).
  const categorie = new Map<string, { centesimi:number; righe:number }>(); let subtotale=0, righeConCosto=0, righeSenzaCosto=0;
  for (const riga of bom.righe) { if (riga.costoUnitario===null || !Number.isFinite(riga.costoUnitario)) { righeSenzaCosto++; continue; } const totale=totaleRigaBomInCentesimi(riga.quantita,riga.costoUnitario); subtotale+=totale; righeConCosto++; const corrente=categorie.get(riga.categoria)??{centesimi:0,righe:0}; corrente.centesimi+=totale; corrente.righe++; categorie.set(riga.categoria,corrente); }
  return {righeConCosto,righeSenzaCosto,subtotale:subtotale/100,categorie:[...categorie.entries()].map(([categoria,valore])=>({categoria,totale:valore.centesimi/100,righe:valore.righe})).sort((a,b)=>b.totale-a.totale),completo:bom.righe.length>0&&righeSenzaCosto===0};
}
export { calcolaPrezzoBom };
