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
  if (!Number.isFinite(valore) || valore < 0 || valore > 100) throw new Error(`${nome} deve essere compresa tra 0 e 100.`);
}

function importoValido(nome: string, valore: number) {
  if (!Number.isFinite(valore) || valore < 0) throw new Error(`${nome} deve essere maggiore o uguale a zero.`);
}

const arrotonda = (value: number) => Math.round((value + Number.EPSILON) * 1000) / 1000;

export function calcolaPrezzoBom(costoProduzione: number, input: BomPrezzoInput = {}): BomPrezzoSummary {
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

  const baseConRicarico = arrotonda(costoProduzione * (1 + ricaricoPercentuale / 100));
  const costiAggiuntivi = arrotonda(costiFissi + lavorazioni + manodopera + spese);
  const baseCommerciale = arrotonda(baseConRicarico + costiAggiuntivi);
  const sconto = arrotonda(baseCommerciale * (scontoPercentuale / 100));
  const imponibile = arrotonda(Math.max(0, baseCommerciale - sconto));
  const iva = arrotonda(imponibile * (ivaPercentuale / 100));
  const totale = arrotonda(imponibile + iva);

  return { costoProduzione, costiFissi, lavorazioni, manodopera, spese, costiAggiuntivi, baseConRicarico: baseCommerciale, sconto, imponibile, iva, totale, ricaricoPercentuale, scontoPercentuale, ivaPercentuale };
}
