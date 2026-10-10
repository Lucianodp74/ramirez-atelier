import { describe, expect, it } from 'vitest';

import { calcolaPrezzoBom as calcolaPrezzoCompatibile } from '@/server/services/bom-pricing-calculation';
import { calcolaPrezzoBom } from '@/lib/bom-pricing-calculation';

describe('motore prezzi BOM condiviso', () => {
  it('mantiene il default Ramirez del 40% anche dal vecchio percorso server', () => {
    expect(calcolaPrezzoCompatibile(100)).toEqual(calcolaPrezzoBom(100));
    expect(calcolaPrezzoCompatibile(100).ricaricoPercentuale).toBe(40);
    expect(calcolaPrezzoCompatibile(100).baseConRicarico).toBe(140);
  });

  it('mantiene il ricarico esplicito, incluso lo zero, senza divergenze', () => {
    expect(calcolaPrezzoCompatibile(100, { ricaricoPercentuale: 0 })).toEqual(
      calcolaPrezzoBom(100, { ricaricoPercentuale: 0 }),
    );
    expect(calcolaPrezzoCompatibile(100, { ricaricoPercentuale: 20 }).baseConRicarico).toBe(120);
  });
});
