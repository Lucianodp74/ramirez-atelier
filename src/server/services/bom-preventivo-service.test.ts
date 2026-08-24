import { describe, expect, it, vi } from 'vitest';

import { preparaSnapshotPreventivoBom } from '@/server/services/bom-preventivo-service';

vi.mock('@/server/services/bom-service', () => ({
  dettaglioBom: vi.fn(),
}));

import { dettaglioBom } from '@/server/services/bom-service';

const mockDettaglioBom = vi.mocked(dettaglioBom);

describe('BOM quote snapshot', () => {
  it('requires a confirmed or closed BOM with priced rows', async () => {
    mockDettaglioBom.mockResolvedValue({
      id: 'bom-1',
      tenantId: 'tenant-1',
      richiestaId: 'req-1',
      stato: 'CONFERMATA',
      versione: 1,
      noteProduzione: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      righe: [
        {
          id: 'riga-1',
          bomId: 'bom-1',
          ordinamento: 0,
          categoria: 'materiale',
          codice: 'OL-01',
          descrizione: 'Olivo',
          unita: 'mq',
          quantita: 2,
          materiale: 'Olivo',
          lavorazione: null,
          costoUnitario: 50,
          note: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    const snapshot = await preparaSnapshotPreventivoBom('tenant-1', 'bom-1', {
      ricaricoPercentuale: 20,
      ivaPercentuale: 22,
    });

    expect(snapshot?.costoProduzione).toBe(100);
    expect(snapshot?.prezzo.baseConRicarico).toBe(120);
    expect(snapshot?.prezzo.totale).toBeCloseTo(146.4);
  });

  it('rejects a draft BOM', async () => {
    mockDettaglioBom.mockResolvedValue({
      id: 'bom-1',
      tenantId: 'tenant-1',
      richiestaId: 'req-1',
      stato: 'BOZZA',
      versione: 1,
      noteProduzione: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      righe: [],
    });

    await expect(preparaSnapshotPreventivoBom('tenant-1', 'bom-1')).rejects.toThrow(
      'La BOM deve essere confermata',
    );
  });

  it('rejects unpriced rows', async () => {
    mockDettaglioBom.mockResolvedValue({
      id: 'bom-1',
      tenantId: 'tenant-1',
      richiestaId: 'req-1',
      stato: 'CONFERMATA',
      versione: 1,
      noteProduzione: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      righe: [
        {
          id: 'riga-1',
          bomId: 'bom-1',
          ordinamento: 0,
          categoria: 'materiale',
          codice: null,
          descrizione: 'Elemento senza prezzo',
          unita: 'pz',
          quantita: 1,
          materiale: null,
          lavorazione: null,
          costoUnitario: null,
          note: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    });

    await expect(preparaSnapshotPreventivoBom('tenant-1', 'bom-1')).rejects.toThrow(
      'Tutte le righe BOM devono avere un costo unitario',
    );
  });
});
