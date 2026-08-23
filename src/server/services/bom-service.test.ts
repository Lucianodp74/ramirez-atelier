import { describe, expect, it } from 'vitest';

function validateQuantity(value: number) {
  if (!Number.isFinite(value) || value <= 0) throw new Error('La quantità BOM deve essere maggiore di zero.');
}

describe('BOM foundation invariants', () => {
  it('rejects zero quantities', () => {
    expect(() => validateQuantity(0)).toThrow();
  });

  it('rejects negative quantities', () => {
    expect(() => validateQuantity(-1)).toThrow();
  });

  it('accepts positive quantities', () => {
    expect(() => validateQuantity(1)).not.toThrow();
  });
});
