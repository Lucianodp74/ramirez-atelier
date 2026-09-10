import { describe, expect, it } from 'vitest';
import { costruisciTariffeDaListino, CODICI_TARIFFE_PREVENTIVATORE } from './preventivatore-listino-service';

const voce = (codice: string, prezzo: number, unita: string) => ({ codice, prezzo, unita, attivo: true });

function listinoCompleto() {
  return [
    voce(CODICI_TARIFFE_PREVENTIVATORE.materiali.TRUCIOLARE, 10, 'M2'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.materiali.MDF, 20, 'M2'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.materiali.MULTISTRATO, 30, 'M2'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.finiture.MELAMINICO, 1, 'M2'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.finiture.LAMINATO, 2, 'M2'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.finiture.LACCATO, 3, 'M2'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.bordo, 4, 'ML'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.retro, 5, 'M2'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.ferramentaPorta, 6, 'PZ'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.ferramentaCassetto, 7, 'PZ'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.oreBase, 0.5, 'H'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.orePerM2, 0.6, 'H/M2'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.orePerPorta, 0.7, 'H/PZ'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.orePerCassetto, 0.8, 'H/PZ'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.orePerRipiano, 0.9, 'H/PZ'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.costoOra, 40, 'EUR/H'),
    voce(CODICI_TARIFFE_PREVENTIVATORE.ricarico, 35, '%'),
  ];
}

describe('adapter Listino -> Preventivatore', () => {
  it('trasforma le voci amministrative in tariffe del motore senza prezzi hard-coded', () => {
    const tariffe = costruisciTariffeDaListino(listinoCompleto());
    expect(tariffe.materialeEuroM2.TRUCIOLARE).toBe(10);
    expect(tariffe.finituraEuroM2.LACCATO).toBe(3);
    expect(tariffe.costoOra).toBe(40);
    expect(tariffe.ricaricoPercentuale).toBe(35);
  });

  it('fallisce in modo esplicito se manca una tariffa obbligatoria', () => {
    const voci = listinoCompleto().filter((x) => x.codice !== CODICI_TARIFFE_PREVENTIVATORE.costoOra);
    expect(() => costruisciTariffeDaListino(voci)).toThrow('Manca nel Listino la tariffa MAN-COSTO-ORA.');
  });

  it('controlla anche l unità di misura', () => {
    const voci = listinoCompleto().map((x) => x.codice === CODICI_TARIFFE_PREVENTIVATORE.bordo ? { ...x, unita: 'M2' } : x);
    expect(() => costruisciTariffeDaListino(voci)).toThrow('unità attesa ML');
  });
});
