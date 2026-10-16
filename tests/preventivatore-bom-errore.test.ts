import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  transazione: vi.fn(),
  calcolaCosti: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {
    tipoProgetto: {
      findMany: vi.fn(async () => [{ id: 'tipo-1', chiave: 'falegnameria', ordinamento: 0 }]),
    },
    $transaction: mock.transazione,
  },
}));
vi.mock('@/server/identity/tenant-corrente', () => ({
  idTenantRamirezAtelier: vi.fn(async () => 'tenant-ramirez'),
}));
vi.mock('@/server/services/preventivatore-listino-service', () => ({
  caricaTariffePreventivatore: vi.fn(async () => ({})),
}));
vi.mock('@/lib/preventivatore/prezzo-modulare', () => ({
  calcolaPreventivoModulare: vi.fn(() => ({
    righe: [{ id: 'm1', costoProduzione: 10 }],
    costoProduzione: 10,
    prezzoFalegname: 10,
    prezzoIndicativo: 14,
    errori: [],
  })),
}));
vi.mock('@/lib/preventivatore/validazione-moduli', () => ({ validaInputModuli: vi.fn() }));
vi.mock('@/lib/preventivatore/bom-iniziale', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/preventivatore/bom-iniziale')>()),
  costiRigheBomIniziale: mock.calcolaCosti,
}));

import { salvaRichiestaPreventivatore } from '@/app/preventivatore/azioni';
import { ErroreBomIniziale } from '@/lib/preventivatore/bom-iniziale';

describe('salvaRichiestaPreventivatore — BOM iniziale non coerente', () => {
  beforeEach(() => {
    mock.transazione.mockReset();
    mock.calcolaCosti.mockReset();
  });

  it('fallisce esplicitamente senza aprire la transazione: nessun dato parziale', async () => {
    mock.calcolaCosti.mockImplementation(() => {
      throw new ErroreBomIniziale('Modulo m1: nessuna riga della BOM può assorbire lo scarto.');
    });

    await expect(
      salvaRichiestaPreventivatore([{ id: 'm1' }], {
        nome: 'Mario Rossi',
        email: 'mario@example.com',
      }),
    ).rejects.toBeInstanceOf(ErroreBomIniziale);

    // Né la richiesta né la BOM vengono scritte.
    expect(mock.transazione).not.toHaveBeenCalled();
  });

  it('con una BOM coerente la transazione viene aperta come sempre', async () => {
    mock.calcolaCosti.mockReturnValue([]);
    mock.transazione.mockResolvedValue({ richiesta: { id: 'r1', tokenRipresa: 't' }, bomId: 'b1' });

    await salvaRichiestaPreventivatore([{ id: 'm1' }], {
      nome: 'Mario Rossi',
      email: 'mario@example.com',
    });

    expect(mock.calcolaCosti).toHaveBeenCalledOnce();
    expect(mock.transazione).toHaveBeenCalledOnce();
  });
});
