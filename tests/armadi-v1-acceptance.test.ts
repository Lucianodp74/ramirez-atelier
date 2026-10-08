import { describe, expect, it } from 'vitest';
import { calcolaPreventivoModulare, TARIFFE_DEMO } from '@/lib/preventivatore/prezzo-modulare';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';

const colonna = (id: string): ModuloConfigurato => ({
  id,
  tipo: 'COLONNA',
  larghezzaCm: 80,
  altezzaCm: 260,
  profonditaCm: 60,
  materiale: 'TRUCIOLARE',
  finitura: 'MELAMINICO',
  configurazione: 'ANTE_BATTENTI',
  ripiani: 4,
});

describe('Armadi V1 — caso di collaudo 240 x 260 x 60', () => {
  it('accetta tre colonne da 80 cm e produce una stima unica', () => {
    const risultato = calcolaPreventivoModulare(
      [colonna('armadio-1'), colonna('armadio-2'), colonna('armadio-3')],
      TARIFFE_DEMO,
    );

    expect(risultato.errori).toEqual([]);
    expect(risultato.righe).toHaveLength(3);
    expect(risultato.righe.every((riga) => riga.tipo === 'COLONNA')).toBe(true);
    expect(risultato.righe.every((riga) => riga.distinta.ante === 2)).toBe(true);
    expect(risultato.righe.every((riga) => riga.distinta.ripiani === 4)).toBe(true);
    expect(risultato.costoProduzione).toBeGreaterThan(0);
    expect(risultato.prezzoIndicativo).toBeGreaterThan(risultato.costoProduzione);
  });

  it('mantiene la larghezza complessiva dell armadio come somma dei moduli', () => {
    const moduli = [colonna('armadio-1'), colonna('armadio-2'), colonna('armadio-3')];
    expect(moduli.reduce((totale, modulo) => totale + modulo.larghezzaCm, 0)).toBe(240);
    expect(Math.max(...moduli.map((modulo) => modulo.altezzaCm))).toBe(260);
    expect(Math.max(...moduli.map((modulo) => modulo.profonditaCm))).toBe(60);
  });

  it('non accetta una colonna fuori dall altezza massima prevista dal catalogo', () => {
    expect(() => calcolaPreventivoModulare([{ ...colonna('fuori-limite'), altezzaCm: 281 }])).not.toThrow();
    const risultato = calcolaPreventivoModulare([{ ...colonna('fuori-limite'), altezzaCm: 281 }]);
    expect(risultato.righe).toHaveLength(0);
    expect(risultato.errori[0]).toContain('altezza fuori limite');
  });
});


describe('Armadi V1 — sistema ante scorrevoli', () => {
  it('addebita il sistema scorrevole da 700 € una sola volta sull intero armadio', () => {
    const moduli = [
      { ...colonna('scorrevole-1'), configurazione: 'ANTE_SCORREVOLI' as const },
      { ...colonna('scorrevole-2'), configurazione: 'ANTE_SCORREVOLI' as const },
      { ...colonna('scorrevole-3'), configurazione: 'ANTE_SCORREVOLI' as const },
    ];
    const tariffe = { ...TARIFFE_DEMO, ferramentaPerScorrevole: 700 };
    const risultato = calcolaPreventivoModulare(moduli, tariffe);

    expect(risultato.errori).toEqual([]);
    expect(risultato.righe).toHaveLength(3);
    expect(risultato.righe.map((riga) => riga.ferramenta)).toEqual([700, 0, 0]);
    expect(risultato.righe.map((riga) => riga.distinta.ferramentaPz)).toEqual([1, 1, 1]);
    expect(risultato.righe.reduce((totale, riga) => totale + riga.ferramenta, 0)).toBe(700);
  });
});
