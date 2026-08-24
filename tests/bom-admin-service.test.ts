import { describe, expect, it } from 'vitest';
import { validaCostoUnitarioBom, validaQuantitaBom, validaTransizioneBom } from '@/server/services/bom-service';

describe('BOM admin business boundaries', () => {
  it('accepts only positive finite quantities', () => {
    expect(() => validaQuantitaBom(1)).not.toThrow();
    expect(() => validaQuantitaBom(0)).toThrow();
    expect(() => validaQuantitaBom(-1)).toThrow();
    expect(() => validaQuantitaBom(Number.NaN)).toThrow();
    expect(() => validaQuantitaBom(Number.POSITIVE_INFINITY)).toThrow();
  });

  it('accepts null or non-negative finite unit costs', () => {
    expect(() => validaCostoUnitarioBom(null)).not.toThrow();
    expect(() => validaCostoUnitarioBom(0)).not.toThrow();
    expect(() => validaCostoUnitarioBom(12.5)).not.toThrow();
    expect(() => validaCostoUnitarioBom(-0.01)).toThrow();
    expect(() => validaCostoUnitarioBom(Number.NaN)).toThrow();
  });

  it('allows only forward BOM state transitions', () => {
    expect(() => validaTransizioneBom('BOZZA', 'CONFERMATA')).not.toThrow();
    expect(() => validaTransizioneBom('CONFERMATA', 'CHIUSA')).not.toThrow();
    expect(() => validaTransizioneBom('BOZZA', 'CHIUSA')).toThrow();
    expect(() => validaTransizioneBom('CHIUSA', 'BOZZA')).toThrow();
  });
});
