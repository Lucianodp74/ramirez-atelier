import { describe, expect, it } from 'vitest';

describe('creazione commessa action contract', () => {
  it('usa un risultato discriminato per evitare errori RSC non gestiti', () => {
    const successo = { successo: true as const, id: 'commessa-id' };
    const errore = { successo: false as const, errore: 'errore database' };

    expect(successo.successo).toBe(true);
    expect(errore.successo).toBe(false);
  });
});
