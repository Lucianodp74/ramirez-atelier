import { describe, expect, it } from 'vitest';

describe('BOM quantity invariant', () => {
  const validate = (value: number) => {
    if (!Number.isFinite(value) || value <= 0) throw new Error('La quantità BOM deve essere maggiore di zero.');
  };

  it('accepts positive quantities', () => expect(() => validate(1)).not.toThrow());
  it('rejects zero and negative quantities', () => {
    expect(() => validate(0)).toThrow();
    expect(() => validate(-1)).toThrow();
  });
});
