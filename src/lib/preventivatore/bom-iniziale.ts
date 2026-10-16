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
 * CONVENZIONE MONETARIA. Il costo unitario è salvato in centesimi
 * (DECIMAL(12,2), >= 0) e la quantità in millesimi (DECIMAL(12,3), > 0). Chi
 * legge la BOM (riepilogo costi, preventivo, commessa, KPI) somma il prodotto
 * esatto quantità × costo unitario, senza arrotondare le righe, e da quella
 * somma ricava anche il prezzo. Questa funzione garantisce che la somma
 * esatta sia uguale al centesimo al costo di produzione del modulo, con
 * aritmetica intera:
 *
 *  1. le righe a pezzi interi danno sempre centesimi esatti;
 *  2. le righe a quantità frazionaria (bordatura in ml, manodopera in ore)
 *     possono dare frazioni di centesimo: si ritoccano di quanto basta
 *     perché insieme diano centesimi esatti. Il costo unitario si sposta di
 *     pochi centesimi (al più 0,50 €). La quantità si tocca solo per la
 *     manodopera, stima parametrica delle ore, e solo nella terza cifra
 *     decimale (al più ±0,004 h), che il motore non usa perché arrotonda le
 *     quantità a due; le misure fisiche, come i metri di bordatura, non
 *     cambiano mai;
 *  3. lo scarto rimasto, in centesimi interi, va su una sola riga con
 *     quantità 1 che resti valida (Base, poi Cielo, poi le altre a pezzo
 *     singolo, lo Schienale per ultimo).
 *
 * Fra le soluzioni possibili vince quella con il punteggio più basso:
 * importo spostato fra le righe più 20 centesimi per ogni millesimo di
 * quantità ritoccato; a parità, meno quantità ritoccate, poi costi unitari
 * più vicini al motore. La scelta è deterministica. Se nessuna
 * rispetta i vincoli del database, la funzione lancia `ErroreBomIniziale`:
 * meglio nessuna BOM che una BOM incoerente.
 */
export interface CostoRigaBom {
  codice: string;
  quantita: number;
  costoUnitario: number;
  /** Prodotto esatto quantità × costo unitario, come lo somma chi legge la BOM. */
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

/** Ritocco massimo del costo unitario di una riga frazionaria, in centesimi. */
const RITOCCO_COSTO = 50;
/** Ritocco massimo della quantità di una riga frazionaria, in millesimi (terza cifra decimale). */
const RITOCCO_QUANTITA = 4;
/**
 * Righe la cui quantità può essere ritoccata: solo la manodopera, che è una
 * stima parametrica delle ore (pochi secondi). Le misure fisiche, come i
 * metri di bordatura da applicare, restano sempre quelle della distinta.
 */
const QUANTITA_RITOCCABILI = new Set(['MAN-ORE']);
/**
 * Penalità, in centesimi, per ogni millesimo di quantità ritoccato: la
 * quantità si ritocca solo quando evita di spostare fra le righe più di
 * questo importo per millesimo.
 */
const PENALITA_QUANTITA = 20;

/**
 * Importi interi: quantità in millesimi, costo in centesimi; il loro prodotto
 * è in centomillesimi di euro, quindi 1000 unità fanno un centesimo.
 */
const UN_CENTESIMO = 1000;
const centesimi = (valore: number) => Math.round(valore * 100);
const millesimi = (quantita: number) => Math.round(quantita * 1000);
const modulo = (n: number) => ((n % UN_CENTESIMO) + UN_CENTESIMO) % UN_CENTESIMO;

interface RigaIntera {
  codice: string;
  millesimi: number;
  centesimi: number;
}
const valore = (riga: { millesimi: number; centesimi: number }) => riga.millesimi * riga.centesimi;

/** Un possibile ritocco di una riga frazionaria. */
interface Ritocco {
  millesimi: number;
  centesimi: number;
  /** Variazione dell'importo della riga, in centomillesimi di euro. */
  variazione: number;
  /** Quanto si allontana dai valori del motore: quantità prima, poi costo. */
  scostamentoQuantita: number;
  scostamentoCosto: number;
}

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
 * Ritocchi ammessi per una riga frazionaria. Il costo può scendere fino a
 * zero (la riga esce dalla BOM), mai sotto; la quantità resta positiva.
 */
function ritocchi(riga: RigaIntera, ammessi: boolean): Ritocco[] {
  if (!ammessi) {
    return [{ ...riga, variazione: 0, scostamentoQuantita: 0, scostamentoCosto: 0 }];
  }
  const elenco: Ritocco[] = [];
  const ritoccoQuantita = QUANTITA_RITOCCABILI.has(riga.codice) ? RITOCCO_QUANTITA : 0;
  for (let e = -ritoccoQuantita; e <= ritoccoQuantita; e++) {
    if (riga.millesimi + e <= 0) continue;
    for (let d = -Math.min(riga.centesimi, RITOCCO_COSTO); d <= RITOCCO_COSTO; d++) {
      const nuova = { millesimi: riga.millesimi + e, centesimi: riga.centesimi + d };
      elenco.push({
        ...nuova,
        variazione: valore(nuova) - valore(riga),
        scostamentoQuantita: Math.abs(e),
        scostamentoCosto: Math.abs(d),
      });
    }
  }
  return elenco;
}

/**
 * Combinazioni di ritocchi delle righe frazionarie la cui somma è esatta in
 * centesimi. Il motore produce al più due righe frazionarie (bordatura e
 * manodopera): se fossero di più, solo le prime due si ritoccano.
 */
function combinazioniEsatte(frazionarie: RigaIntera[]): Ritocco[][] {
  const opzioni = frazionarie.map((riga, i) => ritocchi(riga, i < 2));
  if (opzioni.length === 0) return [[]];
  const fisse = opzioni.slice(2).map((elenco) => elenco[0]);
  const restoFisse = fisse.reduce((s, r) => s + valore(r), 0);
  if (opzioni.length === 1) {
    return opzioni[0].filter((r) => modulo(valore(r)) === 0).map((r) => [r]);
  }
  // Seconda riga raggruppata per resto, per accoppiarla alla prima in un passaggio.
  const perResto = new Map<number, Ritocco[]>();
  for (const r of opzioni[1]) {
    const resto = modulo(valore(r));
    perResto.set(resto, [...(perResto.get(resto) ?? []), r]);
  }
  const combinazioni: Ritocco[][] = [];
  for (const prima of opzioni[0]) {
    const cercato = modulo(-(valore(prima) + restoFisse));
    for (const seconda of perResto.get(cercato) ?? []) {
      combinazioni.push([prima, seconda, ...fisse]);
    }
  }
  return combinazioni;
}

/** Riga a pezzo singolo che può ricevere `scarto` centesimi restando positiva. */
function rigaDiCompensazione(righe: RigaIntera[], scarto: number): RigaIntera | undefined {
  return righe
    .filter((riga) => riga.millesimi === UN_CENTESIMO && riga.centesimi + scarto > 0)
    .sort(
      (a, b) =>
        prioritaCompensazione(a.codice) - prioritaCompensazione(b.codice) ||
        b.centesimi - a.centesimi,
    )[0];
}

/**
 * Costo di ogni componente della distinta, nella forma in cui viene salvato
 * nella BOM. Restituisce solo righe valide per il database (quantità > 0,
 * costo unitario > 0 in centesimi) la cui somma esatta di quantità × costo
 * unitario è uguale a `riga.costoProduzione`. Lancia `ErroreBomIniziale` se
 * questo non è possibile.
 */
export function costiRigheBomIniziale(riga: RigaCostoModulo): CostoRigaBom[] {
  const candidate: RigaIntera[] = riga.distinta.componenti
    .map((componente) => {
      const quantita = millesimi(componente.quantita);
      const importo = importoComponente(componente, riga);
      const costo = quantita > 0 ? Math.max(0, centesimi(importo / (quantita / 1000))) : 0;
      return { codice: componente.codice, millesimi: quantita, centesimi: costo };
    })
    .filter((item) => item.millesimi > 0);

  const atteso = centesimi(riga.costoProduzione) * UN_CENTESIMO;
  // Righe ritoccabili: quelle a quantità frazionaria e la manodopera, anche a
  // ore intere, perché può assorbire le frazioni di centesimo della bordatura
  // senza toccarne i metri.
  const frazionarie = candidate.filter(
    (item) =>
      item.centesimi > 0 &&
      (item.millesimi % UN_CENTESIMO !== 0 || QUANTITA_RITOCCABILI.has(item.codice)),
  );
  const intere = candidate.filter((item) => !frazionarie.includes(item));
  const sommaIntere = intere.reduce((somma, item) => somma + valore(item), 0);

  let migliore:
    | {
        scelta: Ritocco[];
        scarto: number;
        compensazione?: RigaIntera;
        punteggio: number;
        scostamentoQuantita: number;
        scostamentoCosto: number;
      }
    | undefined;
  for (const scelta of combinazioniEsatte(frazionarie)) {
    const sommaFrazionarie = scelta.reduce((s, r) => s + valore(r), 0);
    const scarto = (atteso - sommaIntere - sommaFrazionarie) / UN_CENTESIMO;
    const compensazione = scarto === 0 ? undefined : rigaDiCompensazione(intere, scarto);
    if (scarto !== 0 && !compensazione) continue;
    // Importo spostato fra le righe, in centesimi: ritocchi più scarto.
    const spostato =
      Math.abs(scarto) + scelta.reduce((s, r) => s + Math.abs(r.variazione), 0) / UN_CENTESIMO;
    const scostamentoQuantita = scelta.reduce((s, r) => s + r.scostamentoQuantita, 0);
    const scostamentoCosto = scelta.reduce((s, r) => s + r.scostamentoCosto, 0);
    const punteggio = spostato + PENALITA_QUANTITA * scostamentoQuantita;
    const meglio =
      !migliore ||
      punteggio < migliore.punteggio ||
      (punteggio === migliore.punteggio &&
        (scostamentoQuantita < migliore.scostamentoQuantita ||
          (scostamentoQuantita === migliore.scostamentoQuantita &&
            scostamentoCosto < migliore.scostamentoCosto)));
    if (meglio) {
      migliore = {
        scelta,
        scarto,
        compensazione,
        punteggio,
        scostamentoQuantita,
        scostamentoCosto,
      };
    }
  }

  if (!migliore) {
    const scarto = (atteso - sommaIntere - frazionarie.reduce((s, r) => s + valore(r), 0)) / 1e5;
    throw new ErroreBomIniziale(
      `Modulo ${riga.id}: nessuna riga della BOM può assorbire uno scarto di arrotondamento di ${scarto} € senza diventare negativa.`,
    );
  }

  const { scelta, scarto, compensazione } = migliore;
  frazionarie.forEach((item, i) => {
    item.millesimi = scelta[i].millesimi;
    item.centesimi = scelta[i].centesimi;
  });
  if (compensazione) compensazione.centesimi += scarto;

  const righe = candidate.filter((item) => item.centesimi > 0);
  // Controllo finale sui valori come verranno salvati e sommati: nessuna BOM incoerente.
  const totale = righe.reduce((somma, item) => somma + valore(item), 0);
  if (totale !== atteso) {
    throw new ErroreBomIniziale(
      `Modulo ${riga.id}: le righe della BOM sommano a ${totale / 1e5} € invece di ${atteso / 1e5} €.`,
    );
  }
  return righe.map((item) => ({
    codice: item.codice,
    quantita: item.millesimi / 1000,
    costoUnitario: item.centesimi / 100,
    totale: valore(item) / 1e5,
  }));
}
