import { describe, expect, it } from 'vitest';
import { calcolaCostiCompletiPerCommessa } from '@/server/services/kpi-service';

describe('snapshot costi KPI', () => {
  it('somma solo righe complete con quantità positiva e costo non negativo', () => {
    const result = calcolaCostiCompletiPerCommessa([
      { commessaId: 'A', quantita: 2, costoUnitario: 15 },
      { commessaId: 'A', quantita: 3, costoUnitario: 10 },
      { commessaId: 'B', quantita: 1, costoUnitario: 50 },
    ]);

    expect(result.get('A')).toBe(60);
    expect(result.get('B')).toBe(50);
  });

  it.each([
    { commessaId: 'A', quantita: 0, costoUnitario: 10 },
    { commessaId: 'A', quantita: -1, costoUnitario: 10 },
    { commessaId: 'A', quantita: 1, costoUnitario: -10 },
    { commessaId: 'A', quantita: Number.NaN, costoUnitario: 10 },
    { commessaId: 'A', quantita: 1, costoUnitario: Number.POSITIVE_INFINITY },
    { commessaId: 'A', quantita: 1e308, costoUnitario: 1e308 },
  ])('esclude l’intera commessa se una riga ha valori non validi: $quantita × $costoUnitario', (riga) => {
    const result = calcolaCostiCompletiPerCommessa([
      { commessaId: 'A', quantita: 2, costoUnitario: 15 },
      riga,
    ]);

    expect(result.has('A')).toBe(false);
  });

  it('non fa apparire completo un totale parziale quando manca un costo', () => {
    const result = calcolaCostiCompletiPerCommessa([
      { commessaId: 'A', quantita: 2, costoUnitario: 15 },
      { commessaId: 'A', quantita: 1, costoUnitario: null },
    ]);

    expect(result.has('A')).toBe(false);
  });
});
