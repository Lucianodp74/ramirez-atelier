import { describe, expect, it } from 'vitest';
import { calcolaPuntualitaConsegne } from '@/server/services/kpi-service';

describe('puntualità consegne KPI', () => {
  it('calcola la percentuale solo sulle consegne con entrambe le date valide', () => {
    const result = calcolaPuntualitaConsegne([
      { consegnataIl: new Date('2026-10-01T10:00:00Z'), dataPrevistaConsegna: new Date('2026-10-01T12:00:00Z') },
      { consegnataIl: new Date('2026-10-02T10:00:00Z'), dataPrevistaConsegna: new Date('2026-10-01T12:00:00Z') },
      { consegnataIl: null, dataPrevistaConsegna: new Date('2026-10-01T12:00:00Z') },
      { consegnataIl: new Date('2026-10-01T10:00:00Z'), dataPrevistaConsegna: null },
    ]);

    expect(result).toEqual({ percentuale: 50, puntuali: 1, campione: 2, disponibile: true });
  });

  it('segnala il KPI non disponibile se non ci sono consegne valutabili', () => {
    const result = calcolaPuntualitaConsegne([
      { consegnataIl: null, dataPrevistaConsegna: null },
    ]);

    expect(result).toEqual({ percentuale: 0, puntuali: 0, campione: 0, disponibile: false });
  });

  it('ignora date non valide invece di contarle come ritardi', () => {
    const result = calcolaPuntualitaConsegne([
      { consegnataIl: 'data-errata', dataPrevistaConsegna: '2026-10-01' },
    ]);

    expect(result.disponibile).toBe(false);
    expect(result.campione).toBe(0);
  });
});
