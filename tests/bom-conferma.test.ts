import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRaw, executeRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {
    $queryRaw: queryRaw,
    $executeRaw: executeRaw,
  },
}));

import { cambiaStatoBom } from '@/server/services/bom-service';

const TENANT_ID = 'tenant-1';
const BOM_ID = 'bom-1';

describe('cambiaStatoBom — conferma', () => {
  beforeEach(() => {
    queryRaw.mockReset();
    executeRaw.mockReset();
  });

  it('rifiuta una BOM vuota', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: BOM_ID, stato: 'BOZZA' }])
      .mockResolvedValueOnce([{ righe: 0, costiMancanti: 0 }]);

    await expect(cambiaStatoBom(TENANT_ID, BOM_ID, 'CONFERMATA')).rejects.toThrow(
      'La BOM non può essere confermata senza righe.',
    );
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('rifiuta una BOM con costi mancanti', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: BOM_ID, stato: 'BOZZA' }])
      .mockResolvedValueOnce([{ righe: 3, costiMancanti: 1 }]);

    await expect(cambiaStatoBom(TENANT_ID, BOM_ID, 'CONFERMATA')).rejects.toThrow(
      'La BOM non può essere confermata: completa prima tutti i costi delle righe.',
    );
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('conferma una BOM completa e con costi valorizzati', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: BOM_ID, stato: 'BOZZA' }])
      .mockResolvedValueOnce([{ righe: 3, costiMancanti: 0 }]);

    await cambiaStatoBom(TENANT_ID, BOM_ID, 'CONFERMATA');

    expect(executeRaw).toHaveBeenCalledTimes(1);
  });

  it('non esegue il controllo dei costi quando lo stato richiesto non è CONFERMATA', async () => {
    queryRaw.mockResolvedValueOnce([{ id: BOM_ID, stato: 'CONFERMATA' }]);

    await cambiaStatoBom(TENANT_ID, BOM_ID, 'CHIUSA');

    expect(queryRaw).toHaveBeenCalledTimes(1);
    expect(executeRaw).toHaveBeenCalledTimes(1);
  });
});
