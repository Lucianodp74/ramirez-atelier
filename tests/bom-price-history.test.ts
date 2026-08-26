import { describe, expect, it } from 'vitest';

function cambioPrezzoNecessario(precedente: number | null, nuovo: number | null) {
  return precedente !== nuovo;
}

describe('BOM price history', () => {
  it('registra una modifica quando il costo cambia', () => {
    expect(cambioPrezzoNecessario(6.3, 6.8)).toBe(true);
  });

  it('non registra una modifica quando il costo resta uguale', () => {
    expect(cambioPrezzoNecessario(6.3, 6.3)).toBe(false);
  });

  it('considera l inserimento iniziale come valorizzazione da null', () => {
    expect(cambioPrezzoNecessario(null, 6.3)).toBe(true);
  });
});
