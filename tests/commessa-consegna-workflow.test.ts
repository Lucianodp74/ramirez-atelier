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

import { cambiaStatoCommessa } from '@/server/services/commessa-service';

const TENANT_ID = 'tenant-1';
const COMMESSA_ID = 'commessa-1';

const dettaglio = (stato: 'CONSEGNATA' | 'CHIUSA') => [{
  id: COMMESSA_ID,
  tenantId: TENANT_ID,
  richiestaId: 'richiesta-1',
  numero: 'COM-2026-TEST',
  stato,
  noteProduzione: null,
  fonteBomId: 'bom-1',
  fonteBomVersione: 1,
  dataPrevistaConsegna: null,
  avviataIl: new Date(),
  prontaIl: new Date(),
  consegnataIl: stato === 'CONSEGNATA' || stato === 'CHIUSA' ? new Date() : null,
  chiusaIl: stato === 'CHIUSA' ? new Date() : null,
  createdAt: new Date(),
  updatedAt: new Date(),
  clienteNome: 'Cliente Test',
  tipoProgettoNome: 'Armadio',
  clienteEmail: null,
  clienteTelefono: null,
  righe: [],
}];

describe('workflow reale consegna commessa', () => {
  beforeEach(() => {
    queryRaw.mockReset();
    executeRaw.mockReset();
  });

  it('consente PRONTA → CONSEGNATA e restituisce la commessa consegnata', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'PRONTA' }])
      .mockResolvedValueOnce(dettaglio('CONSEGNATA'))
      .mockResolvedValueOnce([]);

    const result = await cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'CONSEGNATA');

    expect(result).toEqual({ ...dettaglio('CONSEGNATA')[0], righe: [] });
    expect(executeRaw).toHaveBeenCalledTimes(1);
  });

  it('consente CONSEGNATA → CHIUSA e restituisce la commessa chiusa', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'CONSEGNATA' }])
      .mockResolvedValueOnce(dettaglio('CHIUSA'))
      .mockResolvedValueOnce([]);

    const result = await cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'CHIUSA');

    expect(result).toEqual({ ...dettaglio('CHIUSA')[0], righe: [] });
    expect(executeRaw).toHaveBeenCalledTimes(1);
  });

  it('blocca CONSEGNATA se la commessa non è PRONTA', async () => {
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'IN_PRODUZIONE' }]);

    await expect(
      cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'CONSEGNATA'),
    ).rejects.toThrow('Transizione commessa non consentita: IN_PRODUZIONE → CONSEGNATA.');

    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('blocca CHIUSA se la commessa non è CONSEGNATA', async () => {
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'PRONTA' }]);

    await expect(
      cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'CHIUSA'),
    ).rejects.toThrow('Transizione commessa non consentita: PRONTA → CHIUSA.');

    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('non consente operazioni su una commessa di un altro tenant', async () => {
    queryRaw.mockResolvedValueOnce([]);

    await expect(
      cambiaStatoCommessa('tenant-altro', COMMESSA_ID, 'CONSEGNATA'),
    ).rejects.toThrow('Commessa non trovata.');

    expect(executeRaw).not.toHaveBeenCalled();
  });
});
