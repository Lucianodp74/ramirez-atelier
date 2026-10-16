import { beforeEach, describe, expect, it, vi } from 'vitest';

const { dettaglioBom } = vi.hoisted(() => ({ dettaglioBom: vi.fn() }));
vi.mock('@/server/services/bom-service', () => ({ dettaglioBom }));
vi.mock('@/server/db', () => ({ db: {} }));

import { moduliPerPreventivatore } from '@/lib/catalogo-librerie/catalogo';
import { calcolaPrezzoBom } from '@/lib/bom-pricing-calculation';
import { totaleBom, totaleRigaBom } from '@/lib/bom-totali';
import { costiRigheBomIniziale } from '@/lib/preventivatore/bom-iniziale';
import { CATALOGO_MODULI, type ModuloConfigurato } from '@/lib/preventivatore/moduli';
import {
  calcolaPreventivoModulare,
  type TariffePreventivatore,
} from '@/lib/preventivatore/prezzo-modulare';
import { riepilogoCostoBom } from '@/server/services/bom-pricing-service';
import { preparaSnapshotPreventivoBom } from '@/server/services/bom-preventivo-service';
import { calcolaCostiCompletiPerCommessa } from '@/server/services/kpi-service';

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

/** Righe della BOM iniziale come le salva il Preventivatore, per tutti i moduli. */
function righeBomIniziale(moduli: ModuloConfigurato[], tariffe = LISTINO) {
  const preventivo = calcolaPreventivoModulare(moduli, tariffe);
  const righe = preventivo.righe.flatMap((riga, m) =>
    costiRigheBomIniziale(riga).map((costo, i) => ({
      id: `r-${m}-${i}`,
      categoria: costo.codice,
      codice: costo.codice,
      descrizione: costo.codice,
      unita: 'PZ',
      quantita: costo.quantita,
      costoUnitario: costo.costoUnitario,
    })),
  );
  return { preventivo, righe };
}

const bom = (righe: unknown[], stato = 'CONFERMATA') => ({
  id: 'bom-1',
  richiestaId: 'richiesta-1',
  versione: 1,
  stato,
  righe,
});

/** Totali che ciascun consumatore ricava dalle stesse righe salvate. */
async function totaliDeiConsumatori(righe: Array<{ quantita: number; costoUnitario: number }>) {
  dettaglioBom.mockResolvedValue(bom(righe));
  const riepilogo = await riepilogoCostoBom('tenant-1', 'bom-1');
  const snapshot = await preparaSnapshotPreventivoBom('tenant-1', 'bom-1', {
    ricaricoPercentuale: 40,
  });
  const kpi = calcolaCostiCompletiPerCommessa(
    righe.map((r) => ({ commessaId: 'c1', quantita: r.quantita, costoUnitario: r.costoUnitario })),
  ).get('c1');
  return {
    riepilogo: riepilogo!.subtotale,
    snapshot: snapshot!.costoProduzione,
    kpi,
    snapshotInfo: snapshot!,
  };
}

const codex: ModuloConfigurato = {
  id: 'codex',
  tipo: 'BASE',
  larghezzaCm: 53,
  altezzaCm: 103,
  profonditaCm: 63,
  materiale: 'TRUCIOLARE',
  finitura: 'MELAMINICO',
  configurazione: 'APERTO',
  ripiani: 11,
};

describe('consumatori della BOM — stessa convenzione dei totali di riga', () => {
  beforeEach(() => dettaglioBom.mockReset());

  const righeFrazionarie = [
    {
      id: 'a',
      categoria: 'MANODOPERA',
      codice: 'MAN-ORE',
      descrizione: 'Ore',
      unita: 'H',
      quantita: 6.55,
      costoUnitario: 40.02,
    },
    {
      id: 'b',
      categoria: 'BORDO',
      codice: 'BORDO-ML',
      descrizione: 'Bordo',
      unita: 'ML',
      quantita: 0.41,
      costoUnitario: 2.5,
    },
    {
      id: 'c',
      categoria: 'STRUTTURA',
      codice: 'PANNELLO-BASE',
      descrizione: 'Base',
      unita: 'PZ',
      quantita: 1,
      costoUnitario: 6.9,
    },
  ];

  it('riepilogo costi: subtotale e categorie sono somme di totali di riga arrotondati', async () => {
    dettaglioBom.mockResolvedValue(bom(righeFrazionarie, 'BOZZA'));
    const riepilogo = await riepilogoCostoBom('tenant-1', 'bom-1');
    // 262,131 → 262,13; 1,025 → 1,03; 6,90.
    expect(riepilogo?.subtotale).toBe(270.06);
    expect(riepilogo?.categorie).toEqual([
      { categoria: 'MANODOPERA', totale: 262.13, righe: 1 },
      { categoria: 'STRUTTURA', totale: 6.9, righe: 1 },
      { categoria: 'BORDO', totale: 1.03, righe: 1 },
    ]);
  });

  it('snapshot del preventivo: totale di ogni riga arrotondato, costo = loro somma', async () => {
    dettaglioBom.mockResolvedValue(bom(righeFrazionarie));
    const snapshot = await preparaSnapshotPreventivoBom('tenant-1', 'bom-1', {
      ricaricoPercentuale: 40,
    });
    expect(snapshot?.righe.map((r) => r.totaleCosto)).toEqual([262.13, 1.03, 6.9]);
    expect(snapshot?.costoProduzione).toBe(270.06);
    expect(snapshot?.prezzo.baseConRicarico).toBe(378.08);
  });

  it('KPI: costo della commessa con la stessa convenzione', () => {
    const totali = calcolaCostiCompletiPerCommessa(
      righeFrazionarie.map((r) => ({
        commessaId: 'c1',
        quantita: r.quantita,
        costoUnitario: r.costoUnitario,
      })),
    );
    expect(totali.get('c1')).toBe(270.06);
  });
});

describe('BOM iniziale letta dai consumatori — costo e prezzo uguali al motore', () => {
  beforeEach(() => dettaglioBom.mockReset());

  it('LIB-ESS-01 (due moduli): 790,00 € di costo e 1.106,00 € di prezzo ovunque', async () => {
    const moduli = moduliPerPreventivatore('LIB-ESS-01', { anteprimaInterna: true })!;
    const { preventivo, righe } = righeBomIniziale(moduli);
    expect(preventivo).toMatchObject({ costoProduzione: 790, prezzoIndicativo: 1106 });

    const totali = await totaliDeiConsumatori(righe);
    expect(totali).toMatchObject({ riepilogo: 790, snapshot: 790, kpi: 790 });
    expect(totali.snapshotInfo.prezzo.baseConRicarico).toBe(1106);
  });

  it('il caso segnalato in revisione (BASE 53×103×63, 11 ripiani) dà 460,41 € e 644,57 €', async () => {
    const { preventivo, righe } = righeBomIniziale([codex]);
    expect(preventivo).toMatchObject({ costoProduzione: 460.41, prezzoIndicativo: 644.57 });
    // Con la somma grezza i consumatori ottenevano 460,4012 € e un prezzo di 644,56 €.
    const grezza = righe.reduce((s, r) => s + r.quantita * r.costoUnitario, 0);
    expect(grezza).not.toBe(460.41);
    expect(calcolaPrezzoBom(grezza).baseConRicarico).toBe(644.56);

    const totali = await totaliDeiConsumatori(righe);
    expect(totali).toMatchObject({ riepilogo: 460.41, snapshot: 460.41, kpi: 460.41 });
    expect(totali.snapshotInfo.prezzo.baseConRicarico).toBe(644.57);
    // Ogni totale di riga dello snapshot è quello della convenzione.
    for (const [i, riga] of totali.snapshotInfo.righe.entries()) {
      expect(riga.totaleCosto).toBe(totaleRigaBom(righe[i].quantita, righe[i].costoUnitario));
    }
  });

  it('ogni tipo, configurazione e misura: totale BOM e prezzo uguali al motore', () => {
    let provati = 0;
    for (const c of CATALOGO_MODULI) {
      for (const configurazione of c.configurazioni) {
        for (let w = c.min.larghezzaCm; w <= c.max.larghezzaCm; w += 23) {
          for (let h = c.min.altezzaCm; h <= c.max.altezzaCm; h += 29) {
            for (const ripiani of [0, 1, 5, 11]) {
              const modulo: ModuloConfigurato = {
                id: `${c.codice}-${configurazione}-${w}-${h}-${ripiani}`,
                tipo: c.codice,
                larghezzaCm: w,
                altezzaCm: h,
                profonditaCm: c.min.profonditaCm + 5,
                materiale: c.materiali[0],
                finitura: c.finiture[0],
                configurazione,
                ripiani,
              };
              const { preventivo, righe } = righeBomIniziale([modulo]);
              const costo = totaleBom(righe);
              expect(costo, modulo.id).toBe(preventivo.costoProduzione);
              expect(calcolaPrezzoBom(costo).baseConRicarico, modulo.id).toBe(
                preventivo.prezzoIndicativo,
              );
              expect(
                calcolaCostiCompletiPerCommessa(
                  righe.map((r) => ({
                    commessaId: 'c',
                    quantita: r.quantita,
                    costoUnitario: r.costoUnitario,
                  })),
                ).get('c'),
                modulo.id,
              ).toBe(preventivo.costoProduzione);
              provati += 1;
            }
          }
        }
      }
    }
    expect(provati).toBeGreaterThan(1000);
  });

  it('quantità e costi unitari salvati restano quelli della ripartizione (nessun ritocco)', () => {
    const { preventivo, righe } = righeBomIniziale([codex]);
    const distinta = preventivo.righe[0].distinta.componenti;
    for (const riga of righe) {
      const componente = distinta.find((c) => c.codice === riga.codice)!;
      expect(riga.quantita, riga.codice).toBe(componente.quantita);
    }
  });
});
