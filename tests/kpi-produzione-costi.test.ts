import { describe, expect, it } from 'vitest';
import { calcolaCostiCompletiPerCommessa } from '@/server/services/kpi-service';

describe('costi produzione KPI', () => {
  it('somma le righe quando tutti i costi sono disponibili', () => {
    const result = calcolaCostiCompletiPerCommessa([
      { commessaId: 'completa', quantita: 2, costoUnitario: 10 },
      { commessaId: 'completa', quantita: 3, costoUnitario: 5 },
    ]);

    expect(result.get('completa')).toBe(35);
  });

  it('esclude il costo totale di una commessa se anche una sola riga non ha costo', () => {
    const result = calcolaCostiCompletiPerCommessa([
      { commessaId: 'incompleta', quantita: 2, costoUnitario: 10 },
      { commessaId: 'incompleta', quantita: 1, costoUnitario: null },
      { commessaId: 'completa', quantita: 1, costoUnitario: 40 },
    ]);

    expect(result.has('incompleta')).toBe(false);
    expect(result.get('completa')).toBe(40);
  });

  it('esclude quantità o costi non numerici', () => {
    const result = calcolaCostiCompletiPerCommessa([
      { commessaId: 'non-valida', quantita: Number.NaN, costoUnitario: 20 },
    ]);

    expect(result.has('non-valida')).toBe(false);
  });
});
