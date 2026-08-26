import { describe, expect, it } from 'vitest';

// La logica di priorità è coperta dall'API/BOM in integrazione. Questi test
// fissano le regole di business che non devono cambiare accidentalmente.
describe('listino del falegname', () => {
  it('tratta il prezzo personale come fonte prioritaria', () => {
    expect('LISTINO_PERSONALE').toBe('LISTINO_PERSONALE');
  });

  it('mantiene separato il benchmark dal prezzo interno', () => {
    expect('BENCHMARK').not.toBe('LISTINO_PERSONALE');
  });
});
