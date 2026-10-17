import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  crea: vi.fn(),
  evento: vi.fn(),
  executeRaw: vi.fn(),
  trovaOriginale: vi.fn(),
  creaDaPuntoDiPartenza: vi.fn(),
  eventoPuntoDiPartenza: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {
    tipoProgetto: {
      findMany: vi.fn(async () => [{ id: 'tipo-1', chiave: 'falegnameria', ordinamento: 0 }]),
    },
    richiestaProgetto: { findUnique: mock.trovaOriginale, create: mock.creaDaPuntoDiPartenza },
    eventoAttivita: { create: mock.eventoPuntoDiPartenza },
    $transaction: async (corpo: (tx: unknown) => unknown) =>
      corpo({
        richiestaProgetto: { create: mock.crea },
        eventoAttivita: { create: mock.evento },
        $executeRaw: mock.executeRaw,
      }),
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
    righe: [],
    costoProduzione: 900,
    prezzoFalegname: 1100,
    prezzoIndicativo: 1540,
    errori: [],
  })),
}));
vi.mock('@/lib/preventivatore/validazione-moduli', () => ({ validaInputModuli: vi.fn() }));

import { generaTokenRipresa } from '@/lib/identity/token';
import { salvaRichiestaPreventivatore } from '@/app/preventivatore/azioni';
import { creaRichiestaDaPuntoDiPartenza } from '@/server/services/richieste-service';

/** 32 byte casuali in base64url. */
const TOKEN_SICURO = /^[A-Za-z0-9_-]{43}$/;
/** Formato del default `cuid()` della colonna: prevedibile, da non usare come credenziale. */
const TOKEN_CUID = /^c[a-z0-9]{24}$/;

describe('generaTokenRipresa', () => {
  it('produce 256 bit in base64url, utilizzabili in un URL e in un cookie senza codifica', () => {
    const token = generaTokenRipresa();

    expect(token).toMatch(TOKEN_SICURO);
    expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    expect(encodeURIComponent(token)).toBe(token);
  });

  it('non produce mai due volte lo stesso valore né un cuid', () => {
    const tokens = Array.from({ length: 2000 }, () => generaTokenRipresa());

    expect(new Set(tokens).size).toBe(tokens.length);
    expect(tokens.some((token) => TOKEN_CUID.test(token))).toBe(false);
  });

  it('non segue un ordine temporale: due token consecutivi non condividono un prefisso', () => {
    // Un cuid generato nello stesso millisecondo condivide i primi 9+ caratteri.
    const prefissi = new Set(Array.from({ length: 200 }, () => generaTokenRipresa().slice(0, 6)));

    expect(prefissi.size).toBeGreaterThan(195);
  });
});

describe('creazione delle richieste — token impostato esplicitamente', () => {
  beforeEach(() => {
    for (const funzione of Object.values(mock)) funzione.mockReset();
  });

  it('salvaRichiestaPreventivatore assegna un token sicuro e non lo restituisce al browser', async () => {
    mock.crea.mockImplementation(async ({ data }) => ({
      id: 'richiesta-1',
      tokenRipresa: data.tokenRipresa,
    }));

    const risposta = await salvaRichiestaPreventivatore([{ id: 'm1', tipo: 'LIBRERIA' }], {
      nome: 'Mario Rossi',
      email: 'mario@example.com',
    });

    const assegnato = mock.crea.mock.calls[0][0].data.tokenRipresa;
    expect(assegnato).toMatch(TOKEN_SICURO);
    expect(risposta).not.toHaveProperty('tokenRipresa');
    expect(JSON.stringify(risposta)).not.toContain(assegnato);
    expect(risposta.successo).toBe(true);
    expect(risposta.id).toBe('richiesta-1');
  });

  it('due richieste del Preventivatore ricevono token diversi', async () => {
    mock.crea.mockResolvedValue({ id: 'richiesta-1', tokenRipresa: 'x' });
    const dati = { nome: 'Mario Rossi', email: 'mario@example.com' };

    await salvaRichiestaPreventivatore([{ id: 'm1' }], dati);
    await salvaRichiestaPreventivatore([{ id: 'm1' }], dati);

    const [primo, secondo] = mock.crea.mock.calls.map((chiamata) => chiamata[0].data.tokenRipresa);
    expect(primo).toMatch(TOKEN_SICURO);
    expect(secondo).toMatch(TOKEN_SICURO);
    expect(primo).not.toBe(secondo);
  });

  it('creaRichiestaDaPuntoDiPartenza assegna un token sicuro alla nuova bozza', async () => {
    mock.trovaOriginale.mockResolvedValue({
      id: 'originale-1',
      tenantId: 'tenant-ramirez',
      tipoProgettoId: 'tipo-1',
      datiFormJson: { materiale: 'rovere' },
    });
    mock.creaDaPuntoDiPartenza.mockImplementation(async ({ data }) => ({ id: 'nuova-1', ...data }));

    await creaRichiestaDaPuntoDiPartenza('tenant-ramirez', 'originale-1');

    expect(mock.creaDaPuntoDiPartenza.mock.calls[0][0].data.tokenRipresa).toMatch(TOKEN_SICURO);
  });
});
