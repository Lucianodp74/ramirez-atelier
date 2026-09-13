import { describe, expect, it } from 'vitest';
import { calcolaCostoModulo, calcolaPreventivoModulare } from './prezzo-modulare';
import type { ModuloConfigurato } from './moduli';

const base: ModuloConfigurato = {
  id: 'base-60', tipo: 'BASE', larghezzaCm: 60, altezzaCm: 80, profonditaCm: 60,
  materiale: 'TRUCIOLARE', finitura: 'MELAMINICO', configurazione: '2_PORTE', ripiani: 1,
};

describe('preventivatore modulare', () => {
  it('calcola una riga con superficie, materiale, ferramenta e manodopera', () => {
    const riga = calcolaCostoModulo(base);
    expect(riga.superficieM2).toBeGreaterThan(1);
    expect(riga.materiale).toBeGreaterThan(0);
    expect(riga.ferramenta).toBe(36);
    expect(riga.manodopera).toBeGreaterThan(0);
    expect(riga.costoProduzione).toBeGreaterThan(riga.materiale);
  });

  it('include i ripiani nella superficie parametrica e nella bordatura', () => {
    const senzaRipiani = calcolaCostoModulo({ ...base, id: 'base-0', ripiani: 0 });
    const conRipiani = calcolaCostoModulo({ ...base, id: 'base-4', ripiani: 4 });
    expect(conRipiani.superficieM2).toBeGreaterThan(senzaRipiani.superficieM2);
    expect(conRipiani.distinta.bordaturaMl).toBeGreaterThan(senzaRipiani.distinta.bordaturaMl);
    expect(conRipiani.distinta.ripiani).toBe(4);
  });

  it('produce la distinta tecnica parametrica coerente con la configurazione', () => {
    const riga = calcolaCostoModulo(base);
    expect(riga.distinta.fianchi).toBe(2);
    expect(riga.distinta.base).toBe(1);
    expect(riga.distinta.cielo).toBe(1);
    expect(riga.distinta.schienale).toBe(1);
    expect(riga.distinta.ripiani).toBe(1);
    expect(riga.distinta.ante).toBe(2);
    expect(riga.distinta.cassetti).toBe(0);
    expect(riga.distinta.ferramentaPz).toBe(2);
    expect(riga.distinta.bordaturaMl).toBeGreaterThan(0);
    expect(riga.distinta.ore).toBeGreaterThan(0);
  });

  it('rappresenta porte e cassetti separatamente nella configurazione mista', () => {
    const riga = calcolaCostoModulo({ ...base, id: 'mix-1', configurazione: 'PORTE_CASSETTI' });
    expect(riga.distinta.ante).toBe(2);
    expect(riga.distinta.cassetti).toBe(2);
    expect(riga.distinta.componenti.filter(c => c.codice === 'ANTA')).toHaveLength(1);
    expect(riga.distinta.componenti.filter(c => c.codice === 'FRONTALE-CASSETTO')).toHaveLength(1);
  });

  it('somma più moduli e applica il ricarico una sola volta', () => {
    const altro = { ...base, id: 'base-90', larghezzaCm: 90 };
    const preventivo = calcolaPreventivoModulare([base, altro]);
    expect(preventivo.errori).toEqual([]);
    expect(preventivo.righe).toHaveLength(2);
    expect(preventivo.costoProduzione).toBe(
      Math.round((preventivo.righe[0].costoProduzione + preventivo.righe[1].costoProduzione) * 100) / 100,
    );
    expect(preventivo.prezzoIndicativo).toBe(
      Math.round(preventivo.costoProduzione * 1.35 * 100) / 100,
    );
  });

  it('rifiuta dimensioni fuori dai limiti del modulo', () => {
    expect(() => calcolaCostoModulo({ ...base, larghezzaCm: 10 })).toThrow('larghezza fuori limite');
  });
});
