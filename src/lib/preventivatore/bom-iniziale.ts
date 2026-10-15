import type { ComponenteDistinta, RigaCostoModulo } from './prezzo-modulare';

/**
 * BOM INIZIALE DAL PREVENTIVATORE - ripartisce sui componenti della distinta
 * gli importi già calcolati dal motore (`calcolaCostoModulo`), senza
 * ricalcolare prezzi né rileggere il listino:
 *
 *  - struttura (materiale + finitura di fianchi, base, cielo, ripiani):
 *    divisa in proporzione alle superfici restituite dal motore;
 *  - schienale: l'importo dedicato `retro` (tariffa MAT-RETRO-M2), mai una
 *    quota del pannello strutturale;
 *  - frontali (ante, frontali cassetto): materiale + finitura dei frontali,
 *    divisi per numero di pezzi; un modulo aperto non ne ha e nulla si perde;
 *  - bordatura, ferramenta, manodopera: gli importi del motore.
 *
 * Il costo unitario viene salvato in centesimi (DECIMAL(12,2)) e la BOM
 * calcola il totale di riga come costo unitario × quantità: il piccolo
 * scarto di arrotondamento che ne deriva viene assorbito dalla riga "Base",
 * che ha sempre quantità 1, così la somma delle righe coincide al centesimo
 * con il costo di produzione del modulo.
 */
export interface CostoRigaBom {
  codice: string;
  quantita: number;
  costoUnitario: number;
  totale: number;
}

/** Riga che assorbe l'arrotondamento: sempre presente e con quantità 1. */
const CODICE_COMPENSAZIONE = 'PANNELLO-BASE';

const centesimi = (valore: number) => Math.round(valore * 100);
/** La quantità è salvata con tre decimali (DECIMAL(12,3)). */
const quantitaSalvata = (quantita: number) => Math.round(quantita * 1000) / 1000;

function importoComponente(componente: ComponenteDistinta, riga: RigaCostoModulo): number {
  const { struttura, frontali, superfici } = riga.ripartizione;
  const superficieStruttura = superfici.fianchi + superfici.baseCielo + superfici.ripiani;
  const quotaStruttura = (superficie: number) =>
    superficieStruttura > 0 ? struttura * (superficie / superficieStruttura) : 0;
  const pezziFrontali = riga.distinta.componenti
    .filter((item) => item.categoria === 'FRONTALE')
    .reduce((somma, item) => somma + item.quantita, 0);

  switch (componente.codice) {
    case 'PANNELLO-FIANCO':
      return quotaStruttura(superfici.fianchi);
    case 'PANNELLO-BASE':
    case 'PANNELLO-CIELO':
      return quotaStruttura(superfici.baseCielo / 2);
    case 'RIPIANO':
      return quotaStruttura(superfici.ripiani);
    case 'SCHIENALE':
      return riga.retro;
    case 'BORDO-ML':
      return riga.bordo;
    case 'FER-HARDWARE':
      return riga.ferramenta;
    case 'MAN-ORE':
      return riga.manodopera;
    default:
      return componente.categoria === 'FRONTALE' && pezziFrontali > 0
        ? frontali * (componente.quantita / pezziFrontali)
        : 0;
  }
}

/**
 * Costo di ogni componente della distinta, nella forma in cui viene salvato
 * nella BOM. Restituisce solo le righe con quantità e costo positivi; la
 * somma di `totale` è uguale a `riga.costoProduzione`.
 */
export function costiRigheBomIniziale(riga: RigaCostoModulo): CostoRigaBom[] {
  const righe = riga.distinta.componenti
    .map((componente) => {
      const quantita = quantitaSalvata(componente.quantita);
      const importo = importoComponente(componente, riga);
      const costoUnitario = quantita > 0 ? centesimi(importo / quantita) / 100 : 0;
      return { codice: componente.codice, quantita, costoUnitario };
    })
    .filter((item) => item.quantita > 0 && item.costoUnitario > 0)
    .map((item) => ({ ...item, totale: centesimi(item.costoUnitario * item.quantita) / 100 }));

  const scarto =
    centesimi(riga.costoProduzione) -
    righe.reduce((somma, item) => somma + centesimi(item.totale), 0);
  const compensazione = righe.find((item) => item.codice === CODICE_COMPENSAZIONE);
  if (scarto !== 0 && compensazione) {
    compensazione.costoUnitario = (centesimi(compensazione.costoUnitario) + scarto) / 100;
    compensazione.totale = compensazione.costoUnitario;
  }
  return righe;
}
