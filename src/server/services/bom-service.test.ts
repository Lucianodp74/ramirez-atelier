import { describe, expect, it } from 'vitest';
import {
  validaCostoUnitarioBom,
  validaQuantitaBom,
  validaTransizioneBom,
} from './bom-service';

describe('BOM foundation invariants', () => {
  it('validates quantity through the service', () => {
    expect(() => validaQuantitaBom(1)).not.toThrow();
    expect(() => validaQuantitaBom(0)).toThrow();
    expect(() => validaQuantitaBom(-1)).toThrow();
    expect(() => validaQuantitaBom(Number.NaN)).toThrow();
    expect(() => validaQuantitaBom(Number.POSITIVE_INFINITY)).toThrow();
  });

  it('validates unit cost through the service', () => {
    expect(() => validaCostoUnitarioBom(null)).not.toThrow();
    expect(() => validaCostoUnitarioBom(0)).not.toThrow();
    expect(() => validaCostoUnitarioBom(12.5)).not.toThrow();
    expect(() => validaCostoUnitarioBom(-1)).toThrow();
    expect(() => validaCostoUnitarioBom(Number.NaN)).toThrow();
    expect(() => validaCostoUnitarioBom(Number.POSITIVE_INFINITY)).toThrow();
  });

  it('allows only forward BOM state transitions', () => {
    expect(() => validaTransizioneBom('BOZZA', 'CONFERMATA')).not.toThrow();
    expect(() => validaTransizioneBom('CONFERMATA', 'CHIUSA')).not.toThrow();
    expect(() => validaTransizioneBom('BOZZA', 'CHIUSA')).toThrow();
    expect(() => validaTransizioneBom('CHIUSA', 'BOZZA')).toThrow();
    expect(() => validaTransizioneBom('CHIUSA', 'CHIUSA')).not.toThrow();
  });
});
