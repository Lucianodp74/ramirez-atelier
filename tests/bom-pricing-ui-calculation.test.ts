import { describe, expect, it } from 'vitest';
import { calcolaPrezzoBom } from '@/lib/bom-pricing-calculation';

describe('pricing UI calculation', () => {
  it('produces the commercial total used by the BOM preview', () => {
    const result = calcolaPrezzoBom(100, { ricaricoPercentuale: 20, costiFissi: 10, ivaPercentuale: 22 });
    expect(result.baseConRicarico).toBe(130);
    expect(result.imponibile).toBe(130);
    expect(result.totale).toBe(158.6);
  });
});
