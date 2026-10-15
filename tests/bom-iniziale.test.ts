import { describe, expect, it } from 'vitest';
import { moduliPerPreventivatore } from '@/lib/catalogo-librerie/catalogo';
import { costiRigheBomIniziale } from '@/lib/preventivatore/bom-iniziale';
import { CATALOGO_MODULI, type ModuloConfigurato } from '@/lib/preventivatore/moduli';
import {
  calcolaCostoModulo,
  calcolaPreventivoModulare,
  type RigaCostoModulo,
  type TariffePreventivatore,
} from '@/lib/preventivatore/prezzo-modulare';

/**
 * Tariffe del Listino Ramirez come impostate dalle migrazioni
 * `configura_tariffe_preventivatore_ramirez`, `imposta_sistema_scorrevole_ramirez`
 * e `imposta_ricarico_commerciale_40_ramirez`. Spessore e sfrido non sono nel
 * Listino: il motore usa i suoi valori predefiniti.
 */
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

const somma = (valori: number[]) => Math.round(valori.reduce((s, v) => s + v * 100, 0)) / 100;
const totaleBom = (riga: RigaCostoModulo) =>
  somma(costiRigheBomIniziale(riga).map((r) => r.totale));
const rigaBom = (riga: RigaCostoModulo, codice: string) =>
  costiRigheBomIniziale(riga).find((r) => r.codice === codice);
const totaleCodici = (riga: RigaCostoModulo, codici: string[]) =>
  somma(
    costiRigheBomIniziale(riga)
      .filter((r) => codici.includes(r.codice))
      .map((r) => r.totale),
  );
const STRUTTURA = ['PANNELLO-FIANCO', 'PANNELLO-BASE', 'PANNELLO-CIELO', 'RIPIANO'];
const FRONTALI = ['ANTA', 'FRONTALE-CASSETTO'];

function modulo(parziale: Partial<ModuloConfigurato>): ModuloConfigurato {
  return {
    id: 'm1',
    tipo: 'BASE',
    larghezzaCm: 80,
    altezzaCm: 90,
    profonditaCm: 60,
    materiale: 'TRUCIOLARE',
    finitura: 'MELAMINICO',
    configurazione: '2_PORTE',
    ripiani: 1,
    ...parziale,
  };
}

describe('BOM iniziale — modulo aperto: LIB-ESS-01 con il Listino reale', () => {
  const [colonna] = moduliPerPreventivatore('LIB-ESS-01', { anteprimaInterna: true })!;
  const riga = calcolaCostoModulo(colonna, LISTINO);

  it('il motore dà 395,00 € per modulo: struttura, schienale, bordo e manodopera', () => {
    expect(riga).toMatchObject({
      materiale: 67.41,
      finitura: 14.98,
      retro: 23.76,
      bordo: 26.75,
      ferramenta: 0,
      manodopera: 262.1,
      costoProduzione: 395,
    });
    expect(riga.ripartizione.struttura).toBe(82.39);
    expect(riga.ripartizione.frontali).toBe(0);
  });

  it('lo schienale riceve esattamente la tariffa dedicata MAT-RETRO-M2', () => {
    expect(rigaBom(riga, 'SCHIENALE')).toEqual({
      codice: 'SCHIENALE',
      quantita: 1,
      costoUnitario: 23.76,
      totale: 23.76,
    });
  });

  it('materiale e finitura della struttura sono ripartiti per superficie, senza quote perse', () => {
    expect(rigaBom(riga, 'PANNELLO-FIANCO')).toMatchObject({ quantita: 2, costoUnitario: 16.94 });
    expect(rigaBom(riga, 'RIPIANO')).toMatchObject({ quantita: 5, costoUnitario: 6.93 });
    expect(rigaBom(riga, 'PANNELLO-CIELO')).toMatchObject({ quantita: 1, costoUnitario: 6.93 });
    // Arrotondamenti assorbiti dalla Base: al massimo pochi centesimi.
    const base = rigaBom(riga, 'PANNELLO-BASE')!;
    expect(Math.abs(base.totale - 6.93)).toBeLessThanOrEqual(0.05);
    // Nessun frontale: un modulo aperto non ne ha, e nessuna quota resta a metà.
    expect(totaleCodici(riga, FRONTALI)).toBe(0);
  });

  it('la somma delle righe BOM coincide al centesimo con il costo di produzione', () => {
    expect(totaleBom(riga)).toBe(395);
  });

  it('due moduli: BOM 790,00 € come il costo, prezzo al cliente 1.106,00 €', () => {
    const moduli = moduliPerPreventivatore('LIB-ESS-01', { anteprimaInterna: true })!;
    const preventivo = calcolaPreventivoModulare(moduli, LISTINO);

    expect(somma(preventivo.righe.map(totaleBom))).toBe(790);
    expect(preventivo.costoProduzione).toBe(790);
    expect(preventivo.prezzoFalegname).toBe(790);
    expect(preventivo.prezzoIndicativo).toBe(1106);
  });
});

describe('BOM iniziale — moduli con frontali', () => {
  const casi: Array<[string, ModuloConfigurato, Record<string, number>]> = [
    ['base a due ante', modulo({}), { ANTA: 2 }],
    [
      'cassettiera a quattro cassetti',
      modulo({ tipo: 'CASSETTIERA', configurazione: '4_CASSETTI', ripiani: undefined }),
      { 'FRONTALE-CASSETTO': 4 },
    ],
    [
      'ante e cassetti',
      modulo({ configurazione: 'PORTE_CASSETTI', larghezzaCm: 100 }),
      { ANTA: 2, 'FRONTALE-CASSETTO': 2 },
    ],
  ];

  for (const [nome, configurato, pezzi] of casi) {
    describe(nome, () => {
      const riga = calcolaCostoModulo(configurato, LISTINO);

      it('frontali: tutto il materiale e la finitura dei frontali, divisi per pezzo', () => {
        expect(riga.ripartizione.frontali).toBeGreaterThan(0);
        for (const [codice, quantita] of Object.entries(pezzi)) {
          expect(rigaBom(riga, codice)?.quantita, codice).toBe(quantita);
        }
        expect(Math.abs(totaleCodici(riga, FRONTALI) - riga.ripartizione.frontali)).toBeLessThan(
          0.01 * Object.values(pezzi).reduce((s, q) => s + q, 0),
        );
      });

      it('schienale alla tariffa dedicata, struttura senza quote perse', () => {
        expect(rigaBom(riga, 'SCHIENALE')?.totale).toBe(riga.retro);
        expect(
          Math.abs(totaleCodici(riga, STRUTTURA) - riga.ripartizione.struttura),
        ).toBeLessThanOrEqual(0.06);
      });

      it('ferramenta e manodopera sono quelle del motore', () => {
        expect(
          Math.abs((rigaBom(riga, 'FER-HARDWARE')?.totale ?? 0) - riga.ferramenta),
        ).toBeLessThan(0.01 * Object.values(pezzi).reduce((s, q) => s + q, 0));
        expect(Math.abs((rigaBom(riga, 'MAN-ORE')?.totale ?? 0) - riga.manodopera)).toBeLessThan(
          0.05,
        );
      });

      it('la somma delle righe BOM coincide al centesimo con il costo di produzione', () => {
        expect(totaleBom(riga)).toBe(riga.costoProduzione);
      });
    });
  }
});

describe('BOM iniziale — sistema scorrevole e regole invariate', () => {
  it('il sistema scorrevole resta una sola riga da 700 € per l’intero armadio', () => {
    const colonna = modulo({
      tipo: 'COLONNA',
      larghezzaCm: 100,
      altezzaCm: 240,
      configurazione: 'ANTE_SCORREVOLI',
      ripiani: 3,
    });
    const preventivo = calcolaPreventivoModulare([colonna, { ...colonna, id: 'm2' }], LISTINO);
    const [prima, seconda] = preventivo.righe;

    expect(rigaBom(prima, 'FER-HARDWARE')).toMatchObject({ quantita: 1, costoUnitario: 700 });
    expect(rigaBom(seconda, 'FER-HARDWARE')).toBeUndefined();
    expect(somma(preventivo.righe.map(totaleBom))).toBe(preventivo.costoProduzione);
  });

  it('la ripartizione non cambia gli importi del motore', () => {
    const riga = calcolaCostoModulo(modulo({}), LISTINO);
    expect(
      Math.abs(
        riga.ripartizione.struttura + riga.ripartizione.frontali - riga.materiale - riga.finitura,
      ),
    ).toBeLessThanOrEqual(0.01);
    expect(riga.prezzoIndicativo).toBe(Math.round(riga.costoProduzione * 140) / 100);
  });
});

describe('BOM iniziale — ogni tipo e configurazione di modulo', () => {
  it('somma uguale al costo, schienale alla tariffa dedicata, nessun costo negativo', () => {
    let provati = 0;
    for (const catalogo of CATALOGO_MODULI) {
      for (const configurazione of catalogo.configurazioni) {
        for (const ripiani of [undefined, 0, 3]) {
          const configurato: ModuloConfigurato = {
            id: `${catalogo.codice}-${configurazione}-${ripiani}`,
            tipo: catalogo.codice,
            larghezzaCm: catalogo.min.larghezzaCm + 7,
            altezzaCm: catalogo.max.altezzaCm - 13,
            profonditaCm: catalogo.min.profonditaCm + 3,
            materiale: catalogo.materiali.at(-1)!,
            finitura: catalogo.finiture.at(-1)!,
            configurazione,
            ...(ripiani === undefined ? {} : { ripiani }),
          };
          const riga = calcolaCostoModulo(configurato, LISTINO);
          const righe = costiRigheBomIniziale(riga);

          expect(totaleBom(riga), configurato.id).toBe(riga.costoProduzione);
          expect(righe.find((r) => r.codice === 'SCHIENALE')?.totale, configurato.id).toBe(
            riga.retro,
          );
          for (const r of righe)
            expect(r.costoUnitario, `${configurato.id} ${r.codice}`).toBeGreaterThan(0);
          provati += 1;
        }
      }
    }
    // 16 combinazioni tipo × configurazione, ciascuna con tre valori di ripiani.
    expect(provati).toBe(48);
  });
});
