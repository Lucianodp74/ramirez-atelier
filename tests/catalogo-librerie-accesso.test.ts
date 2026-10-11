import { readFileSync } from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const richiediContesto = vi.hoisted(() => vi.fn());

vi.mock('@/server/identity/contesto', () => {
  class ErroreNonAutenticato extends Error {}
  class ErroreAccessoNegato extends Error {}
  return { ErroreNonAutenticato, ErroreAccessoNegato, richiediContesto };
});

import { ErroreAccessoNegato, ErroreNonAutenticato } from '@/server/identity/contesto';
import { anteprimaInternaConsentita } from '@/server/services/catalogo-librerie-accesso';

describe('anteprima interna del Catalogo Librerie', () => {
  beforeEach(() => {
    richiediContesto.mockReset();
  });

  it('è consentita a chi ha il permesso di lettura sul catalogo', async () => {
    richiediContesto.mockResolvedValue({ tenantId: 't1' });
    await expect(anteprimaInternaConsentita()).resolves.toBe(true);
    expect(richiediContesto).toHaveBeenCalledWith({ modulo: 'catalogo', azione: 'leggi' });
  });

  it('è negata, senza errori, a chi non ha una sessione o non ha il permesso', async () => {
    richiediContesto.mockRejectedValueOnce(new ErroreNonAutenticato());
    await expect(anteprimaInternaConsentita()).resolves.toBe(false);
    richiediContesto.mockRejectedValueOnce(new ErroreAccessoNegato('catalogo', 'leggi'));
    await expect(anteprimaInternaConsentita()).resolves.toBe(false);
  });

  it('non inghiotte il segnale di rendering dinamico di Next.js né altri errori', async () => {
    // Stessa forma dell'errore lanciato da cookies() durante il prerendering statico.
    const bailout = Object.assign(new Error('Dynamic server usage: cookies'), {
      digest: 'DYNAMIC_SERVER_USAGE',
    });
    richiediContesto.mockRejectedValueOnce(bailout);
    await expect(anteprimaInternaConsentita()).rejects.toBe(bailout);

    const guasto = new Error('database non raggiungibile');
    richiediContesto.mockRejectedValueOnce(guasto);
    await expect(anteprimaInternaConsentita()).rejects.toBe(guasto);
  });

  it('ogni pagina che usa l’anteprima è dichiarata dinamica', () => {
    for (const pagina of ['src/app/librerie/page.tsx', 'src/app/librerie/[codice]/page.tsx']) {
      const sorgente = readFileSync(pagina, 'utf8');
      expect(sorgente).toContain('anteprimaInternaConsentita');
      expect(sorgente).toMatch(/export const dynamic = 'force-dynamic';/);
    }
  });
});
