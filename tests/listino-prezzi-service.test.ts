import { describe, expect, it, vi } from 'vitest';

const { queryRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: { $queryRaw: queryRaw },
}));

import { cercaPrezziListino } from '@/server/services/listino-prezzi-service';

describe('cercaPrezziListino', () => {
  it('cerca anche nel materiale e non applica una unità predefinita se omessa', async () => {
    queryRaw.mockResolvedValueOnce([
      {
        id: 'mat-1',
        tipo: 'MATERIALE',
        categoria: 'PANNELLO',
        codice: 'MULT-BET-18',
        nome: 'Multistrato betulla 18 mm',
        descrizione: 'Betulla 18 mm',
        unita: 'm²',
        prezzo: 38,
        attivo: true,
        materiale: 'Multistrato betulla',
        larghezzaCm: 250,
        altezzaCm: 125,
        profonditaCm: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    await expect(cercaPrezziListino('tenant-1', 'multistrato')).resolves.toHaveLength(1);
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
});
