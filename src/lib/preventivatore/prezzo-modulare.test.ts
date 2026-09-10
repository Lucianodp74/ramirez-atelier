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

  it('somma più moduli e applica il ricarico una sola volta al totale', () => {
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
