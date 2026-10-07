import { describe, expect, it } from 'vitest';
import { calcolaPreventivoModulare, TARIFFE_DEMO } from '@/lib/preventivatore/prezzo-modulare';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';

describe('prezzo falegname', () => {
  it('ricava il prezzo falegname dal prezzo privato togliendo il ricarico del 40%', () => {
    const modulo: ModuloConfigurato = {
      id: 'test-prezzo-falegname',
      tipo: 'BASE',
      larghezzaCm: 80,
      altezzaCm: 100,
      profonditaCm: 40,
      materiale: 'TRUCIOLARE',
      finitura: 'MELAMINICO',
      configurazione: 'ANTE_BATTENTI',
      ripiani: 1,
    };

    const preventivo = calcolaPreventivoModulare([modulo], TARIFFE_DEMO);

    expect(preventivo.errori).toEqual([]);
    expect(preventivo.prezzoFalegname * 1.4).toBeCloseTo(preventivo.prezzoIndicativo, 2);
  });
});
