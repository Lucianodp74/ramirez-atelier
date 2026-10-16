import { totaleRigaBomInCentesimi } from '@/lib/bom-totali';
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
 * Il costo unitario viene salvato in centesimi (DECIMAL(12,2), >= 0), la
 * quantità con tre decimali (DECIMAL(12,3), > 0). I totali seguono la
 * convenzione della BOM (`@/lib/bom-totali`): totale di riga = quantità ×
 * costo unitario arrotondato al centesimo, totale della BOM = somma dei
 * totali di riga. Lo scarto di arrotondamento viene assorbito da una sola
 * riga con quantità 1, scelta in modo che il suo costo resti valido: il
 * totale della BOM coincide al centesimo con il costo di produzione del
 * modulo. Quantità e costi unitari restano quelli della ripartizione. Se
 * nessuna riga può farlo, la funzione lancia `ErroreBomIniziale`: meglio
 * nessuna BOM che una BOM incoerente.
 */
export interface CostoRigaBom {
  codice: string;
  quantita: number;
  costoUnitario: number;
  totale: number;
}

/** La BOM iniziale non può rispettare insieme i vincoli del database e il costo del motore. */
export class ErroreBomIniziale extends Error {
  constructor(messaggio: string) {
    super(messaggio);
    this.name = 'ErroreBomIniziale';
  }
}

/** Righe preferite per assorbire lo scarto: valore più basso, priorità più alta. */
const prioritaCompensazione = (codice: string) =>
  codice === 'PANNELLO-BASE' ? 0 : codice === 'PANNELLO-CIELO' ? 1 : codice === 'SCHIENALE' ? 3 : 2;

const centesimi = (valore: number) => Math.round(valore * 100);
/** La quantità è salvata con tre decimali (DECIMAL(12,3)). */
const quantitaSalvata = (quantita: number) => Math.round(quantita * 1000) / 1000;
/** Totale di riga in centesimi, con la stessa funzione di chi legge la BOM. */
const totaleInCentesimi = (riga: { quantita: number; costoUnitario: number }) =>
  totaleRigaBomInCentesimi(riga.quantita, riga.costoUnitario);

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
 * nella BOM. Restituisce solo righe valide per il database (quantità > 0,
 * costo unitario > 0 in centesimi) la cui somma, calcolata come la calcola
 * la BOM, è uguale a `riga.costoProduzione`. Lancia `ErroreBomIniziale` se
 * questo non è possibile.
 */
export function costiRigheBomIniziale(riga: RigaCostoModulo): CostoRigaBom[] {
  const candidate = riga.distinta.componenti
    .map((componente) => {
      const quantita = quantitaSalvata(componente.quantita);
      const importo = importoComponente(componente, riga);
      const costoUnitario = quantita > 0 ? centesimi(importo / quantita) / 100 : 0;
      return { codice: componente.codice, quantita, costoUnitario };
    })
    .filter((item) => item.quantita > 0 && item.costoUnitario >= 0);

  const atteso = centesimi(riga.costoProduzione);
  const conCosto = candidate.filter((item) => item.costoUnitario > 0);
  const scarto = atteso - conCosto.reduce((somma, item) => somma + totaleInCentesimi(item), 0);

  if (scarto !== 0) {
    // Solo una riga con quantità 1 assorbe lo scarto al centesimo esatto, e
    // deve restare positiva. Ordine di preferenza: Base e Cielo (quota della
    // struttura, già ripartita per stima), poi le altre righe a pezzo singolo
    // dalla più alta; lo Schienale per ultimo, perché riporta una tariffa
    // dedicata. Anche una riga a costo zero può ricevere uno scarto positivo.
    const compensazione = candidate
      .filter((item) => item.quantita === 1 && centesimi(item.costoUnitario) + scarto > 0)
      .sort(
        (a, b) =>
          prioritaCompensazione(a.codice) - prioritaCompensazione(b.codice) ||
          b.costoUnitario - a.costoUnitario,
      )[0];
    if (!compensazione) {
      throw new ErroreBomIniziale(
        `Modulo ${riga.id}: nessuna riga della BOM può assorbire uno scarto di arrotondamento di ${scarto / 100} € senza diventare negativa.`,
      );
    }
    compensazione.costoUnitario = (centesimi(compensazione.costoUnitario) + scarto) / 100;
  }

  const righe = candidate
    .filter((item) => item.costoUnitario > 0)
    .map((item) => ({ ...item, totale: totaleInCentesimi(item) / 100 }));

  // Controllo finale sui valori come verranno salvati: nessuna BOM incoerente.
  const totale = righe.reduce((somma, item) => somma + centesimi(item.totale), 0);
  if (totale !== atteso) {
    throw new ErroreBomIniziale(
      `Modulo ${riga.id}: le righe della BOM sommano a ${totale / 100} € invece di ${atteso / 100} €.`,
    );
  }
  return righe;
}
