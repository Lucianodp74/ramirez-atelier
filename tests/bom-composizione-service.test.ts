import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRaw, aggiungiRigaBom } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  aggiungiRigaBom: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: { $queryRaw: queryRaw },
}));

vi.mock('@/server/services/bom-service', () => ({
  aggiungiRigaBom,
}));

import {
  aggiungiComposizioneABom,
  mappaRigaComposizioneInBom,
} from '@/server/services/bom-composizione-service';

beforeEach(() => {
  queryRaw.mockReset();
  aggiungiRigaBom.mockReset();
});

describe('mappaRigaComposizioneInBom', () => {
  it('trasferisce quantità, unità e costo snapshot senza ricalcolo', () => {
    expect(
      mappaRigaComposizioneInBom({
        componenteId: 'comp-1',
        categoria: 'PANNELLO',
        codice: 'FIA-18',
        descrizione: 'Fianco multistrato',
        unita: 'pz',
        quantita: 2,
        materiale: 'Betulla',
        costoUnitario: 31.5,
      }),
    ).toEqual({
      categoria: 'PANNELLO',
      codice: 'FIA-18',
      descrizione: 'Fianco multistrato',
      unita: 'pz',
      quantita: 2,
      materiale: 'Betulla',
      costoUnitario: 31.5,
    });
  });
});

describe('aggiungiComposizioneABom', () => {
  it('trasferisce tutte le righe della composizione alla BOM dello stesso tenant', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: 'bom-1', stato: 'BOZZA' }])
      .mockResolvedValueOnce([{ id: 'comp-1' }])
      .mockResolvedValueOnce([
        {
          componenteId: 'p-1',
          categoria: 'PANNELLO',
          codice: 'FIA-18',
          descrizione: 'Fianco',
          unita: 'pz',
          quantita: 2,
          materiale: 'Betulla',
          costoUnitario: 31.5,
        },
        {
          componenteId: 'p-2',
          categoria: 'FERRAMENTA',
          codice: 'CER-01',
          descrizione: 'Cerniera',
          unita: 'pz',
          quantita: 4,
          materiale: null,
          costoUnitario: 3.2,
        },
      ]);
    aggiungiRigaBom.mockResolvedValueOnce('bom-riga-1').mockResolvedValueOnce('bom-riga-2');

    await expect(aggiungiComposizioneABom('tenant-1', 'bom-1', 'comp-1')).resolves.toEqual({
      righeAggiunte: 2,
    });

    expect(aggiungiRigaBom).toHaveBeenNthCalledWith(1, 'tenant-1', 'bom-1', {
      categoria: 'PANNELLO',
      codice: 'FIA-18',
      descrizione: 'Fianco',
      unita: 'pz',
      quantita: 2,
      materiale: 'Betulla',
      costoUnitario: 31.5,
    });
    expect(aggiungiRigaBom).toHaveBeenNthCalledWith(2, 'tenant-1', 'bom-1', {
      categoria: 'FERRAMENTA',
      codice: 'CER-01',
      descrizione: 'Cerniera',
      unita: 'pz',
      quantita: 4,
      materiale: null,
      costoUnitario: 3.2,
    });
  });

  it('rifiuta una BOM non modificabile', async () => {
    queryRaw.mockResolvedValueOnce([{ id: 'bom-1', stato: 'CONFERMATA' }]);

    await expect(aggiungiComposizioneABom('tenant-1', 'bom-1', 'comp-1')).rejects.toThrow(
      'La distinta non è più modificabile.',
    );
    expect(aggiungiRigaBom).not.toHaveBeenCalled();
  });

  it('rifiuta una composizione di un altro tenant', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: 'bom-1', stato: 'BOZZA' }])
      .mockResolvedValueOnce([]);

    await expect(aggiungiComposizioneABom('tenant-1', 'bom-1', 'comp-altro-tenant')).rejects.toThrow(
      'Composizione non trovata.',
    );
    expect(aggiungiRigaBom).not.toHaveBeenCalled();
  });
});
