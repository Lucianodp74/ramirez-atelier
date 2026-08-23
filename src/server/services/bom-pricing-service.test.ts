import { describe, expect, it } from 'vitest';

import { calcolaPrezzoBom } from '@/server/services/bom-pricing-service';

describe('BOM pricing invariants', () => {
  it('applies markup, fixed costs, discount and VAT in order', () => {
    const result = calcolaPrezzoBom(100, {
      ricaricoPercentuale: 20,
      costiFissi: 10,
      scontoPercentuale: 10,
      ivaPercentuale: 22,
    });

    expect(result.baseConRicarico).toBeCloseTo(130);
    expect(result.sconto).toBeCloseTo(13);
    expect(result.imponibile).toBeCloseTo(117);
    expect(result.iva).toBeCloseTo(25.74);
    expect(result.totale).toBeCloseTo(142.74);
  });

  it('rejects percentages outside the 0-100 range', () => {
    expect(() => calcolaPrezzoBom(100, { ricaricoPercentuale: 101 })).toThrow();
    expect(() => calcolaPrezzoBom(100, { scontoPercentuale: -1 })).toThrow();
    expect(() => calcolaPrezzoBom(100, { ivaPercentuale: 101 })).toThrow();
  });

  it('rejects negative monetary values', () => {
    expect(() => calcolaPrezzoBom(-1)).toThrow();
    expect(() => calcolaPrezzoBom(100, { costiFissi: -1 })).toThrow();
  });

  it('uses explicit zero defaults without inventing economics', () => {
    const result = calcolaPrezzoBom(100);

    expect(result.ricaricoPercentuale).toBe(0);
    expect(result.costiFissi).toBe(0);
    expect(result.scontoPercentuale).toBe(0);
    expect(result.ivaPercentuale).toBe(0);
    expect(result.totale).toBe(100);
  });
});
