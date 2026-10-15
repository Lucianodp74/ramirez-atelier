import { describe, expect, it } from 'vitest';
import { costiRigheBomIniziale, ErroreBomIniziale } from '@/lib/preventivatore/bom-iniziale';
import { CATALOGO_MODULI, type ModuloConfigurato } from '@/lib/preventivatore/moduli';
import {
  calcolaCostoModulo,
  calcolaPreventivoModulare,
  type RigaCostoModulo,
  type TariffePreventivatore,
} from '@/lib/preventivatore/prezzo-modulare';

/** Tariffe del Listino Ramirez come impostate dalle migrazioni. */
const LISTINO: TariffePreventivatore = {
  materialeEuroM2: { TRUCIOLARE: 18, MDF: 28, MULTISTRATO: 45 },
  finituraEuroM2: { MELAMINICO: 4, LAMINATO: 25, LACCATO: 45 },
  bordoEuroMl: 2.5,
  retroEuroM2: 12,
  ferramentaPerPorta: 19.5,
  ferramentaPerScorrevole: 700,
  ferramentaPerCassetto: 28,
  oreBase: 0.8,
  orePerM2: 0.9,
  orePerPorta: 0.35,
  orePerCassetto: 0.5,
  orePerRipiano: 0.12,
  costoOra: 40,
  ricaricoPercentuale: 40,
};
const tutte = (prezzo: number) => ({ TRUCIOLARE: prezzo, MDF: prezzo, MULTISTRATO: prezzo });
const finiture = (prezzo: number) => ({ MELAMINICO: prezzo, LAMINATO: prezzo, LACCATO: prezzo });

/** Tariffe ammesse dal Listino (prezzi >= 0) ma con struttura quasi gratuita o gratuita. */
const STRUTTURA_QUASI_GRATUITA = {
  ...LISTINO,
  materialeEuroM2: tutte(0.5),
  finituraEuroM2: finiture(0),
};
const STRUTTURA_GRATUITA = { ...LISTINO, materialeEuroM2: tutte(0), finituraEuroM2: finiture(0) };
const TUTTO_GRATUITO = {
  ...STRUTTURA_GRATUITA,
  retroEuroM2: 0,
  bordoEuroMl: 0,
  ferramentaPerPorta: 0,
  ferramentaPerScorrevole: 0,
  ferramentaPerCassetto: 0,
  costoOra: 0,
};

/** Come il database: quantità DECIMAL(12,3) > 0, costo unitario DECIMAL(12,2) >= 0. */
function persisti(righe: ReturnType<typeof costiRigheBomIniziale>) {
  return righe.map((riga) => ({
    ...riga,
    quantitaSalvata: Math.round(riga.quantita * 1000) / 1000,
    costoSalvato: Math.round(riga.costoUnitario * 100) / 100,
  }));
}
/** Totale in centesimi come lo ricava la BOM dai valori salvati. */
const totaleSalvato = (righe: ReturnType<typeof persisti>) =>
  righe.reduce((s, r) => s + Math.round(r.costoSalvato * r.quantitaSalvata * 100), 0);

/** Moduli di ogni tipo e configurazione, con misure frazionarie e fino a 20 ripiani. */
function moduliDiProva(): ModuloConfigurato[] {
  const moduli: ModuloConfigurato[] = [];
  for (const c of CATALOGO_MODULI) {
    for (const configurazione of c.configurazioni) {
      for (const [w, h, d] of [
        [c.min.larghezzaCm, c.max.altezzaCm, c.min.profonditaCm],
        [c.max.larghezzaCm - 0.5, c.min.altezzaCm + 0.5, c.max.profonditaCm - 0.5],
      ]) {
        for (const ripiani of [undefined, 0, 20]) {
          moduli.push({
            id: `${c.codice}-${configurazione}-${w}-${ripiani}`,
            tipo: c.codice,
            larghezzaCm: w,
            altezzaCm: h,
            profonditaCm: d,
            materiale: c.materiali[0],
            finitura: c.finiture[0],
            configurazione,
            ...(ripiani === undefined ? {} : { ripiani }),
          });
        }
      }
    }
  }
  return moduli;
}

/**
 * Esito per ogni modulo: righe valide e somma esatta, oppure un errore
 * esplicito. Mai una BOM incoerente o un costo negativo.
 */
function verificaTutti(tariffe: TariffePreventivatore) {
  const esiti = { valide: 0, errori: 0 };
  for (const modulo of moduliDiProva()) {
    const riga = calcolaCostoModulo(modulo, tariffe);
    let righe;
    try {
      righe = costiRigheBomIniziale(riga);
    } catch (errore) {
      expect(errore, modulo.id).toBeInstanceOf(ErroreBomIniziale);
      esiti.errori += 1;
      continue;
    }
    const salvate = persisti(righe);
    for (const r of salvate) {
      expect(r.quantitaSalvata, `${modulo.id} ${r.codice}`).toBeGreaterThan(0);
      expect(r.costoSalvato, `${modulo.id} ${r.codice}`).toBeGreaterThan(0);
      expect(r.costoSalvato, `${modulo.id} ${r.codice}`).toBe(r.costoUnitario);
    }
    expect(totaleSalvato(salvate), modulo.id).toBe(Math.round(riga.costoProduzione * 100));
    esiti.valide += 1;
  }
  return esiti;
}

describe('BOM iniziale — casi limite di tariffa', () => {
  it('struttura quasi gratuita: nessun costo negativo, ogni BOM salvata somma al costo', () => {
    const esiti = verificaTutti(STRUTTURA_QUASI_GRATUITA);
    expect(esiti).toEqual({ valide: 96, errori: 0 });
  });

  it('il caso che prima rendeva negativa la Base ora resta valido', () => {
    // Modulo basso aperto, 20 ripiani: la quota della Base (pochi centesimi)
    // non basta ad assorbire lo scarto, che passa a un'altra riga a pezzo singolo.
    const riga = calcolaCostoModulo(
      {
        id: 'base-aperta',
        tipo: 'BASE',
        larghezzaCm: 30,
        altezzaCm: 120,
        profonditaCm: 30,
        materiale: 'TRUCIOLARE',
        finitura: 'MELAMINICO',
        configurazione: 'APERTO',
        ripiani: 20,
      },
      STRUTTURA_QUASI_GRATUITA,
    );
    const righe = costiRigheBomIniziale(riga);
    expect(righe.every((r) => r.costoUnitario > 0)).toBe(true);
    expect(totaleSalvato(persisti(righe))).toBe(Math.round(riga.costoProduzione * 100));
  });

  it('struttura gratuita: righe a zero escluse, somma esatta o errore esplicito', () => {
    const esiti = verificaTutti(STRUTTURA_GRATUITA);
    expect(esiti.valide + esiti.errori).toBe(96);
    // Lo schienale a tariffa dedicata è sempre presente con quantità 1: assorbe lo scarto.
    expect(esiti.errori).toBe(0);
  });

  it('tutto gratuito: una BOM senza costi non genera righe né errori', () => {
    for (const modulo of moduliDiProva()) {
      const riga = calcolaCostoModulo(modulo, TUTTO_GRATUITO);
      expect(riga.costoProduzione, modulo.id).toBe(0);
      expect(costiRigheBomIniziale(riga), modulo.id).toEqual([]);
    }
  });
});

describe('BOM iniziale — esito esplicito quando i vincoli non sono rispettabili', () => {
  /** Riga reale resa impossibile: nessuna riga a pezzo singolo può scendere sotto lo zero. */
  function rigaImpossibile(scartoInCentesimi: number): RigaCostoModulo {
    const riga = calcolaCostoModulo(
      {
        id: 'impossibile',
        tipo: 'LIBRERIA',
        larghezzaCm: 90,
        altezzaCm: 220,
        profonditaCm: 35,
        materiale: 'TRUCIOLARE',
        finitura: 'MELAMINICO',
        configurazione: 'APERTO',
        ripiani: 5,
      },
      { ...STRUTTURA_GRATUITA, retroEuroM2: 0 },
    );
    return { ...riga, costoProduzione: riga.costoProduzione + scartoInCentesimi / 100 };
  }

  it('uno scarto negativo senza righe capaci di assorbirlo è un errore esplicito', () => {
    expect(() => costiRigheBomIniziale(rigaImpossibile(-1))).toThrow(ErroreBomIniziale);
    expect(() => costiRigheBomIniziale(rigaImpossibile(-1))).toThrow(/scarto di arrotondamento/);
  });

  it('uno scarto positivo può essere assorbito anche da una riga a costo zero', () => {
    // Base e Cielo valgono zero (struttura gratuita): lo scarto positivo va
    // sulla Base, che entra nella BOM con un costo valido.
    const riga = rigaImpossibile(10);
    const righe = costiRigheBomIniziale(riga);
    const base = righe.find((r) => r.codice === 'PANNELLO-BASE');
    expect(base?.quantita).toBe(1);
    expect(base?.costoUnitario).toBeGreaterThan(0);
    expect(righe.find((r) => r.codice === 'PANNELLO-CIELO')).toBeUndefined();
    expect(totaleSalvato(persisti(righe))).toBe(Math.round(riga.costoProduzione * 100));
  });
});

describe('BOM iniziale — con il Listino attuale il risultato non cambia', () => {
  it('ogni modulo: lo scarto va sulla Base, lo schienale resta la tariffa dedicata', () => {
    for (const modulo of moduliDiProva()) {
      const riga = calcolaCostoModulo(modulo, LISTINO);
      const righe = costiRigheBomIniziale(riga);
      expect(righe.find((r) => r.codice === 'SCHIENALE')?.totale, modulo.id).toBe(riga.retro);
      expect(righe.find((r) => r.codice === 'PANNELLO-BASE')?.quantita, modulo.id).toBe(1);
      // Il Cielo ha la stessa quota naturale della Base: resta non compensato.
      const quotaBaseCielo =
        (riga.ripartizione.struttura * (riga.ripartizione.superfici.baseCielo / 2)) /
        (riga.ripartizione.superfici.fianchi +
          riga.ripartizione.superfici.baseCielo +
          riga.ripartizione.superfici.ripiani);
      expect(righe.find((r) => r.codice === 'PANNELLO-CIELO')?.costoUnitario, modulo.id).toBe(
        Math.round(quotaBaseCielo * 100) / 100,
      );
      expect(totaleSalvato(persisti(righe)), modulo.id).toBe(
        Math.round(riga.costoProduzione * 100),
      );
    }
  });

  it('LIB-ESS-01 e armadio scorrevole: costi, prezzi e ricarico invariati', () => {
    const libreria: ModuloConfigurato = {
      id: 'c1',
      tipo: 'LIBRERIA',
      larghezzaCm: 90,
      altezzaCm: 220,
      profonditaCm: 35,
      materiale: 'TRUCIOLARE',
      finitura: 'MELAMINICO',
      configurazione: 'APERTO',
      ripiani: 5,
    };
    const libreriaDoppia = calcolaPreventivoModulare(
      [libreria, { ...libreria, id: 'c2' }],
      LISTINO,
    );
    expect(libreriaDoppia).toMatchObject({
      costoProduzione: 790,
      prezzoFalegname: 790,
      prezzoIndicativo: 1106,
    });
    expect(costiRigheBomIniziale(libreriaDoppia.righe[0])).toContainEqual({
      codice: 'SCHIENALE',
      quantita: 1,
      costoUnitario: 23.76,
      totale: 23.76,
    });

    const colonna: ModuloConfigurato = {
      ...libreria,
      tipo: 'COLONNA',
      larghezzaCm: 100,
      altezzaCm: 240,
      profonditaCm: 60,
      configurazione: 'ANTE_SCORREVOLI',
      ripiani: 3,
    };
    const armadio = calcolaPreventivoModulare([colonna, { ...colonna, id: 'c2' }], LISTINO);
    const ferramenta = armadio.righe.flatMap((r) =>
      costiRigheBomIniziale(r).filter((x) => x.codice === 'FER-HARDWARE'),
    );
    expect(ferramenta).toEqual([
      { codice: 'FER-HARDWARE', quantita: 1, costoUnitario: 700, totale: 700 },
    ]);
    expect(armadio.prezzoIndicativo).toBe(Math.round(armadio.costoProduzione * 140) / 100);
  });
});
