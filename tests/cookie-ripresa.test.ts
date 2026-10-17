import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  trovaRichiesta: vi.fn(),
  creaRichiesta: vi.fn(),
  cookieLetto: undefined as string | undefined,
  cookieScritti: [] as Array<{ nome: string; valore: string; opzioni: Record<string, unknown> }>,
}));

vi.mock('@/server/db', () => ({
  db: {
    tipoProgetto: {
      findUnique: vi.fn(async () => ({
        id: 'tipo-1',
        chiave: 'falegnameria',
        nome: 'Falegnameria',
        attivo: true,
        configurazione: { step: [{ chiave: 'unico', titolo: 'Unico', campi: [] }] },
      })),
    },
    richiestaProgetto: { findUnique: mock.trovaRichiesta, create: mock.creaRichiesta },
    eventoAttivita: { create: vi.fn() },
  },
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (nome: string) =>
      mock.cookieLetto === undefined ? undefined : { name: nome, value: mock.cookieLetto },
    set: (nome: string, valore: string, opzioni: Record<string, unknown>) => {
      mock.cookieScritti.push({ nome, valore, opzioni });
    },
  }),
}));
vi.mock('@/lib/storage', () => ({ getStorageAdapter: vi.fn(), determinaCategoria: vi.fn() }));
vi.mock('@/lib/notifiche', () => ({ getEmailAdapter: vi.fn() }));
vi.mock('@/lib/rule-engine/bootstrap', () => ({ assicuraGestoriRegistrati: vi.fn() }));
vi.mock('@/lib/rule-engine/motore', () => ({ eseguiRegolePerContesto: vi.fn() }));
vi.mock('@/server/identity/tenant-corrente', () => ({
  idTenantRamirezAtelier: vi.fn(async () => 'tenant-ramirez'),
}));
vi.mock('@/server/services/variante-preimpostata-service', () => ({
  variantiAttivePerTipoProgetto: vi.fn(async () => []),
}));
vi.mock('@/server/services/cliente-service', () => ({ trovaOCreaCliente: vi.fn() }));
vi.mock('@/lib/configurazione-dinamica', () => ({
  risolviConfigurazioneDinamica: vi.fn(
    async (_tenant: string, configurazione: unknown) => configurazione,
  ),
}));

import { iniziaORecuperaBozza } from '@/app/progetti/[chiave]/azioni';

const NOVANTA_GIORNI = 60 * 60 * 24 * 90;
const bozzaEsistente = {
  id: 'richiesta-1',
  stato: 'BOZZA',
  tipoProgettoId: 'tipo-1',
  tokenRipresa: 'token-della-bozza-esistente',
  documenti: [],
};

describe('cookie di ripresa — attributi', () => {
  beforeEach(() => {
    mock.trovaRichiesta.mockReset();
    mock.creaRichiesta.mockReset();
    mock.creaRichiesta.mockImplementation(async ({ data }) => ({
      id: 'richiesta-nuova',
      stato: 'BOZZA',
      tipoProgettoId: 'tipo-1',
      tokenRipresa: data.tokenRipresa,
      documenti: [],
    }));
    mock.cookieLetto = undefined;
    mock.cookieScritti.length = 0;
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  /** I due punti in cui il cookie viene scritto: bozza nuova e bozza ripresa. */
  const percorsi = {
    'bozza nuova': async () => {
      await iniziaORecuperaBozza('falegnameria');
    },
    'bozza ripresa dal cookie': async () => {
      mock.cookieLetto = bozzaEsistente.tokenRipresa;
      mock.trovaRichiesta.mockResolvedValue(bozzaEsistente);
      await iniziaORecuperaBozza('falegnameria');
    },
    'bozza ripresa da link con token': async () => {
      mock.trovaRichiesta.mockResolvedValue(bozzaEsistente);
      await iniziaORecuperaBozza('falegnameria', bozzaEsistente.tokenRipresa);
    },
  };

  for (const [percorso, apri] of Object.entries(percorsi)) {
    it(`${percorso}: in produzione il cookie è Secure`, async () => {
      vi.stubEnv('NODE_ENV', 'production');

      await apri();

      expect(mock.cookieScritti).toHaveLength(1);
      expect(mock.cookieScritti[0].nome).toBe('ra_bozza_falegnameria');
      expect(mock.cookieScritti[0].opzioni).toEqual({
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        maxAge: NOVANTA_GIORNI,
        path: '/',
      });
    });

    it(`${percorso}: fuori produzione il cookie resta utilizzabile su http://localhost`, async () => {
      for (const ambiente of ['development', 'test']) {
        mock.cookieScritti.length = 0;
        vi.stubEnv('NODE_ENV', ambiente);

        await apri();

        expect(mock.cookieScritti).toHaveLength(1);
        expect(mock.cookieScritti[0].opzioni, ambiente).toMatchObject({
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
        });
      }
    });
  }

  it('il valore del cookie è il token della richiesta, mai restituito nella risposta', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    const risposta = await iniziaORecuperaBozza('falegnameria');

    const { valore } = mock.cookieScritti[0];
    expect(valore).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(JSON.stringify(risposta)).not.toContain(valore);
  });
});
