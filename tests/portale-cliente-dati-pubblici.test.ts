import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findUnique, createEvento } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  createEvento: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {
    richiestaProgetto: { findUnique },
    eventoAttivita: { create: createEvento },
  },
}));

import { recuperaStatoPerCliente } from '@/server/services/portale-cliente-service';

describe('recuperaStatoPerCliente — dati esposti al cliente', () => {
  beforeEach(() => {
    findUnique.mockReset();
    createEvento.mockReset();
    createEvento.mockResolvedValue({});
  });

  it('restituisce solo dati di stato e fascia commerciale, mai costi o dettagli interni di produzione', async () => {
    findUnique.mockResolvedValue({
      id: 'richiesta-1',
      tokenRipresa: 'token-opaco',
      stato: 'PREVENTIVO_INVIATO',
      clienteNome: 'Mario Rossi',
      tipoProgetto: { nome: 'Armadio su misura' },
      fasciaPrezzoMin: 2500,
      fasciaPrezzoMax: 3200,
      createdAt: new Date('2026-10-01T10:00:00.000Z'),
      costoProduzione: 900,
      ricaricoPercentuale: 40,
      costoUnitario: 31.5,
      datiEstensione: {
        preventivo: {
          prezzo: { costoProduzione: 900, imponibile: 2500, totale: 3050 },
        },
      },
    });

    const risultato = await recuperaStatoPerCliente('token-opaco');

    expect(risultato).toEqual({
      trovata: true,
      inviata: true,
      clienteNome: 'Mario Rossi',
      tipoProgettoNome: 'Armadio su misura',
      stato: 'PREVENTIVO_INVIATO',
      messaggio: 'Il preventivo è pronto.',
      fasciaPrezzoMin: 2500,
      fasciaPrezzoMax: 3200,
      createdAt: new Date('2026-10-01T10:00:00.000Z'),
    });
    expect(risultato).not.toHaveProperty('costoProduzione');
    expect(risultato).not.toHaveProperty('ricaricoPercentuale');
    expect(risultato).not.toHaveProperty('costoUnitario');
    expect(risultato).not.toHaveProperty('datiEstensione');
  });

  it('non registra consultazioni per una richiesta in BOZZA e indica che non è stata inviata', async () => {
    findUnique.mockResolvedValue({
      id: 'richiesta-bozza',
      tokenRipresa: 'token-bozza',
      stato: 'BOZZA',
      clienteNome: null,
      tipoProgetto: { nome: 'Cucina' },
      fasciaPrezzoMin: null,
      fasciaPrezzoMax: null,
      createdAt: new Date('2026-10-01T10:00:00.000Z'),
    });

    const risultato = await recuperaStatoPerCliente('token-bozza');

    expect(risultato?.inviata).toBe(false);
    expect(risultato?.messaggio).toBe('La tua richiesta non è ancora stata inviata.');
    expect(createEvento).not.toHaveBeenCalled();
  });
});
