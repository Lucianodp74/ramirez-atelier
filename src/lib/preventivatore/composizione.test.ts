import { describe, expect, it } from 'vitest';
import { calcolaPreventivoModulare, TARIFFE_DEMO } from './prezzo-modulare';
import type { ModuloConfigurato } from './moduli';

const base = (id: string): ModuloConfigurato => ({
  id,
  tipo: 'BASE',
  larghezzaCm: 80,
  altezzaCm: 90,
  profonditaCm: 60,
  materiale: 'TRUCIOLARE',
  finitura: 'MELAMINICO',
  configurazione: '2_PORTE',
  ripiani: 1,
});

const cassettiera: ModuloConfigurato = {
  id: 'cassettiera-1',
  tipo: 'CASSETTIERA',
  larghezzaCm: 60,
  altezzaCm: 80,
  profonditaCm: 60,
  materiale: 'MDF',
  finitura: 'LAMINATO',
  configurazione: '4_CASSETTI',
  ripiani: 0,
};

const pensile: ModuloConfigurato = {
  id: 'pensile-1',
  tipo: 'PENSILE',
  larghezzaCm: 80,
  altezzaCm: 60,
  profonditaCm: 35,
  materiale: 'TRUCIOLARE',
  finitura: 'MELAMINICO',
  configurazione: '2_PORTE',
  ripiani: 2,
};

describe('composizione preventivatore', () => {
  it('calcola 2 basi + cassettiera + 2 pensili e somma le righe', () => {
    const moduli = [base('base-1'), base('base-2'), cassettiera, pensile, { ...pensile, id: 'pensile-2' }];
    const risultato = calcolaPreventivoModulare(moduli, TARIFFE_DEMO);

    expect(risultato.errori).toEqual([]);
    expect(risultato.righe).toHaveLength(5);
    expect(risultato.costoProduzione).toBe(
      risultato.righe.reduce((somma, riga) => somma + riga.costoProduzione, 0),
    );
    expect(risultato.prezzoIndicativo).toBeGreaterThan(risultato.costoProduzione);
  });

  it('non applica il ricarico due volte quando aggrega più moduli', () => {
    const uno = calcolaPreventivoModulare([base('base-1')], TARIFFE_DEMO);
    const due = calcolaPreventivoModulare([base('base-1'), base('base-2')], TARIFFE_DEMO);

    expect(due.prezzoIndicativo).toBeCloseTo(uno.prezzoIndicativo * 2, 2);
  });
});
