import { describe, expect, it } from 'vitest';
import { totaleBom, totaleRigaBom, totaleRigaBomInCentesimi } from '@/lib/bom-totali';

describe('convenzione monetaria della BOM — totale di riga', () => {
  it('arrotonda quantità × costo unitario al centesimo, la metà verso l’alto', () => {
    expect(totaleRigaBom(6.55, 40.02)).toBe(262.13); // 262,131
    expect(totaleRigaBom(10.71, 2.5)).toBe(26.78); // 26,775
    expect(totaleRigaBom(8.95, 2.51)).toBe(22.46); // 22,4645
    expect(totaleRigaBom(0.5, 0.01)).toBe(0.01); // 0,005
    expect(totaleRigaBom(0.001, 0.01)).toBe(0); // 0,00001
  });

  it('non sbaglia per la virgola mobile: 0,41 × 2,50 = 1,025 diventa 1,03', () => {
    // In virgola mobile 0.41 * 2.5 * 100 vale 102.4999…: Math.round darebbe 1,02.
    expect(Math.round(0.41 * 2.5 * 100)).toBe(102);
    expect(totaleRigaBomInCentesimi(0.41, 2.5)).toBe(103);
    expect(Math.round(0.29 * 19.5 * 100)).toBe(565);
    expect(totaleRigaBom(0.29, 19.5)).toBe(5.66); // 5,655
    expect(totaleRigaBom(33.01, 2.5)).toBe(82.53); // 82,525
  });

  it('righe a pezzi interi e costi esatti restano invariate', () => {
    expect(totaleRigaBom(2, 16.94)).toBe(33.88);
    expect(totaleRigaBom(1, 700)).toBe(700);
    expect(totaleRigaBom(5, 6.93)).toBe(34.65);
    expect(totaleRigaBom(3, 0)).toBe(0);
  });

  it('importi molto grandi: calcolo intero esatto anche oltre la precisione dei double', () => {
    expect(totaleRigaBomInCentesimi(999_999.999, 999_999.99)).toBe(99_999_998_900_000);
  });

  it('valori non numerici non producono un totale', () => {
    expect(totaleRigaBomInCentesimi(Number.NaN, 1)).toBeNaN();
    expect(totaleRigaBomInCentesimi(1, Number.POSITIVE_INFINITY)).toBeNaN();
  });
});

describe('convenzione monetaria della BOM — totale della BOM', () => {
  it('è la somma dei totali di riga arrotondati, non della somma grezza', () => {
    const righe = [
      { quantita: 6.55, costoUnitario: 40.02 }, // 262,131 → 262,13
      { quantita: 33.01, costoUnitario: 2.5 }, // 82,525 → 82,53
      { quantita: 1, costoUnitario: 6.9 },
    ];
    expect(totaleBom(righe)).toBe(351.56);
    // La somma grezza darebbe 351,556: è la differenza che la convenzione elimina.
    expect(righe.reduce((s, r) => s + r.quantita * r.costoUnitario, 0)).toBeCloseTo(351.556, 6);
  });

  it('una BOM vuota vale zero', () => {
    expect(totaleBom([])).toBe(0);
  });
});
