import { describe, expect, it } from 'vitest';
import { calcolaMargineLordo } from '@/server/services/kpi-service';

describe('campione KPI margine lordo', () => {
  it('calcola il margine usando imponibile salvato e costo completo', () => {
    expect(calcolaMargineLordo(1200, 900)).toBe(300);
  });

  it('mantiene visibile un margine negativo reale', () => {
    expect(calcolaMargineLordo(800, 900)).toBe(-100);
  });

  it('esclude commesse senza costo completo', () => {
    expect(calcolaMargineLordo(1200, undefined)).toBeNull();
  });

  it.each([null, undefined, '1200', Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'esclude un imponibile commerciale non valido: %s',
    (imponibile) => {
      expect(calcolaMargineLordo(imponibile, 900)).toBeNull();
    },
  );

  it.each([Number.NaN, Number.POSITIVE_INFINITY, -1])(
    'esclude un costo di produzione non valido: %s',
    (costo) => {
      expect(calcolaMargineLordo(1200, costo)).toBeNull();
    },
  );
});
