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

import {
  aggiornaStatoRigaProduzione,
  cambiaStatoCommessa,
} from '@/server/services/commessa-service';

const TENANT_ID = 'tenant-1';
const COMMESSA_ID = 'commessa-1';
const RIGA_ID = 'riga-1';

const DETTAGLIO = [{
  id: COMMESSA_ID,
  tenantId: TENANT_ID,
  richiestaId: 'richiesta-1',
  numero: 'COM-2026-TEST',
  stato: 'PRONTA',
  noteProduzione: null,
  fonteBomId: 'bom-1',
  fonteBomVersione: 1,
  dataPrevistaConsegna: null,
  avviataIl: new Date(),
  prontaIl: new Date(),
  consegnataIl: null,
  chiusaIl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  clienteNome: 'Cliente Test',
  tipoProgettoNome: 'Armadio',
  clienteEmail: null,
  clienteTelefono: null,
  righe: [],
}];

describe('workflow produzione commessa', () => {
  beforeEach(() => {
    queryRaw.mockReset();
    executeRaw.mockReset();
  });

  it('blocca PRONTA se esiste una riga non completata', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'IN_PRODUZIONE' }])
      .mockResolvedValueOnce([]);

    await expect(cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'PRONTA')).rejects.toThrow(
      'La commessa non può essere segnata come pronta: completa prima tutte le righe di produzione.',
    );

    expect(queryRaw).toHaveBeenCalledTimes(2);
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('blocca PRONTA se la commessa non contiene righe di produzione', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'IN_PRODUZIONE' }])
      .mockResolvedValueOnce([]);

    await expect(cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'PRONTA')).rejects.toThrow(
      'La commessa non può essere segnata come pronta: completa prima tutte le righe di produzione.',
    );

    expect(queryRaw).toHaveBeenCalledTimes(2);
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('porta a PRONTA una commessa solo quando il gate atomico non trova righe incomplete', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'IN_PRODUZIONE' }])
      .mockResolvedValueOnce([{ id: COMMESSA_ID }])
      .mockResolvedValueOnce(DETTAGLIO)
      .mockResolvedValueOnce([]);

    const result = await cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'PRONTA');

    expect(result).toEqual({ ...DETTAGLIO[0], righe: [] });
  });

  it('rifiuta una transizione non PRONTA se lo stato cambia prima dell’UPDATE', async () => {
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'DA_AVVIARE' }]);
    executeRaw.mockResolvedValueOnce(0);

    await expect(
      cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'IN_PRODUZIONE'),
    ).rejects.toThrow(
      'La commessa è stata modificata da un’altra operazione. Ricarica e riprova.',
    );

    expect(executeRaw).toHaveBeenCalledTimes(1);
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('aggiorna lo stato di una riga solo quando la commessa è IN_PRODUZIONE', async () => {
    queryRaw
      .mockResolvedValueOnce([{ stato: 'IN_PRODUZIONE' }])
      .mockResolvedValueOnce(DETTAGLIO)
      .mockResolvedValueOnce([]);

    const result = await aggiornaStatoRigaProduzione(
      TENANT_ID,
      COMMESSA_ID,
      RIGA_ID,
      'COMPLETATA',
    );

    expect(result).toEqual({ ...DETTAGLIO[0], righe: [] });
    expect(executeRaw).toHaveBeenCalledTimes(1);
  });

  it('blocca atomicamente l’aggiornamento della riga se la commessa esce dalla produzione dopo la SELECT', async () => {
    queryRaw.mockResolvedValueOnce([{ stato: 'IN_PRODUZIONE' }]);
    executeRaw.mockResolvedValueOnce(0);

    await expect(
      aggiornaStatoRigaProduzione(TENANT_ID, COMMESSA_ID, RIGA_ID, 'DA_FARE'),
    ).rejects.toThrow(
      'La commessa è stata modificata da un’altra operazione. Ricarica e riprova.',
    );

    expect(executeRaw).toHaveBeenCalledTimes(1);
    expect(executeRaw.mock.calls[0][0].join(' ')).toContain('c."stato"');
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('non permette di modificare una riga fuori dalla produzione', async () => {
    queryRaw.mockResolvedValueOnce([{ stato: 'PRONTA' }]);

    await expect(
      aggiornaStatoRigaProduzione(TENANT_ID, COMMESSA_ID, RIGA_ID, 'DA_FARE'),
    ).rejects.toThrow(
      'Le righe di produzione sono modificabili solo quando la commessa è in produzione.',
    );

    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('rifiuta uno stato riga non previsto', async () => {
    await expect(
      aggiornaStatoRigaProduzione(
        TENANT_ID,
        COMMESSA_ID,
        RIGA_ID,
        'STATO_INESISTENTE' as never,
      ),
    ).rejects.toThrow('Stato lavorazione non valido.');

    expect(queryRaw).not.toHaveBeenCalled();
    expect(executeRaw).not.toHaveBeenCalled();
  });
});
