import { beforeEach, describe, expect, it, vi } from 'vitest';

const { caricaTariffe, calcolaPreventivo, tenantId } = vi.hoisted(() => ({
  caricaTariffe: vi.fn(),
  calcolaPreventivo: vi.fn(),
  tenantId: vi.fn(),
}));

vi.mock('@/server/db', () => ({ db: {} }));
vi.mock('@/server/identity/tenant-corrente', () => ({ idTenantRamirezAtelier: tenantId }));
vi.mock('@/server/services/preventivatore-listino-service', () => ({
  caricaTariffePreventivatore: caricaTariffe,
}));
vi.mock('@/lib/preventivatore/prezzo-modulare', () => ({
  calcolaPreventivoModulare: calcolaPreventivo,
}));
vi.mock('@/lib/preventivatore/validazione-moduli', () => ({
  validaInputModuli: vi.fn(),
}));

import { calcolaStimaPreventivatore } from '@/app/preventivatore/azioni';

describe('calcolaStimaPreventivatore — DTO pubblico', () => {
  beforeEach(() => {
    caricaTariffe.mockReset();
    calcolaPreventivo.mockReset();
    tenantId.mockReset();
    tenantId.mockResolvedValue('tenant-ramirez');
    caricaTariffe.mockResolvedValue({ ricaricoPercentuale: 40 });
    calcolaPreventivo.mockReturnValue({
      righe: [{ id: 'modulo-1', costoProduzione: 900, manodopera: 200 }],
      costoProduzione: 900,
      prezzoFalegname: 1100,
      prezzoIndicativo: 1540,
      errori: [],
    });
  });

  it('restituisce al browser solo la stima commerciale, senza costi, manodopera o prezzo falegname', async () => {
    const risultato = await calcolaStimaPreventivatore([{ id: 'modulo-1' }]);

    expect(risultato).toEqual({ successo: true, prezzoIndicativo: 1540 });
    expect(risultato).not.toHaveProperty('costoProduzione');
    expect(risultato).not.toHaveProperty('prezzoFalegname');
    expect(risultato).not.toHaveProperty('righe');
    expect(JSON.stringify(risultato)).not.toMatch(/costoProduzione|prezzoFalegname|manodopera|ricaricoPercentuale/);
    expect(tenantId).toHaveBeenCalledOnce();
    expect(caricaTariffe).toHaveBeenCalledWith('tenant-ramirez');
  });

  it('non restituisce una stima quando il motore rileva errori di configurazione', async () => {
    calcolaPreventivo.mockReturnValue({
      righe: [],
      costoProduzione: 0,
      prezzoFalegname: 0,
      prezzoIndicativo: 0,
      errori: ['Tariffa sistema ante scorrevoli non configurata nel Listino.'],
    });

    await expect(calcolaStimaPreventivatore([{ id: 'modulo-1' }])).rejects.toThrow(
      'Tariffa sistema ante scorrevoli non configurata nel Listino.',
    );
  });
});
