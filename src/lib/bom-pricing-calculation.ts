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

const arrotonda = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

const percentuale = (nome: string, valore: number) => {
  if (!Number.isFinite(valore) || valore < 0 || valore > 100) {
    throw new Error(`${nome} deve essere compresa tra 0 e 100.`);
  }
};

const importo = (nome: string, valore: number) => {
  if (!Number.isFinite(valore) || valore < 0) {
    throw new Error(`${nome} deve essere maggiore o uguale a zero.`);
  }
};

export function calcolaPrezzoBom(costoProduzione: number, input: BomPrezzoInput = {}): BomPrezzoSummary {
  importo('Il costo di produzione', costoProduzione);

  const ricaricoPercentuale = input.ricaricoPercentuale ?? 0;
  const costiFissi = input.costiFissi ?? 0;
  const lavorazioni = input.lavorazioni ?? 0;
  const manodopera = input.manodopera ?? 0;
  const spese = input.spese ?? 0;
  const scontoPercentuale = input.scontoPercentuale ?? 0;
  const ivaPercentuale = input.ivaPercentuale ?? 0;

  percentuale('Il ricarico', ricaricoPercentuale);
  importo('I costi fissi', costiFissi);
  importo('Le lavorazioni', lavorazioni);
  importo('La manodopera', manodopera);
  importo('Le spese', spese);
  percentuale('Lo sconto', scontoPercentuale);
  percentuale("L'IVA", ivaPercentuale);

  const costiVariabili = arrotonda(lavorazioni + manodopera + spese);
  const costiAggiuntivi = arrotonda(costiFissi + costiVariabili);

  // Il ricarico commerciale si applica al solo costo di produzione.
  // Costi fissi, lavorazioni, manodopera e spese vengono poi aggiunti senza ricarico.
  const baseConRicarico = arrotonda(
    costoProduzione * (1 + ricaricoPercentuale / 100) + costiAggiuntivi,
  );
  const sconto = arrotonda(baseConRicarico * scontoPercentuale / 100);
  const imponibile = arrotonda(Math.max(0, baseConRicarico - sconto));
  const iva = arrotonda(imponibile * ivaPercentuale / 100);
  const totale = arrotonda(imponibile + iva);

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
