import { describe, expect, it } from 'vitest';
import { moduliPerPreventivatore } from '@/lib/catalogo-librerie/catalogo';
import type { ModuloConfigurato, ModuloTipo } from '@/lib/preventivatore/moduli';
import {
  confermaSostituzione,
  effettoSceltaTipoProgetto,
  tipoProgettoIniziale,
  type TipoProgetto,
} from '@/lib/preventivatore/tipo-progetto';

const TUTTI: TipoProgetto[] = [
  'ARMADIO',
  'PARETE_ATTREZZATA',
  'MADIA',
  'LIBRERIA',
  'MOBILE_BAGNO',
  'ALTRO',
];

/** Composizione reale di LIB-ESS-01 (bozza: si apre solo in anteprima interna). */
function essenziale180(): ModuloConfigurato[] {
  const moduli = moduliPerPreventivatore('LIB-ESS-01', { anteprimaInterna: true });
  if (!moduli) throw new Error('LIB-ESS-01 non apre il Preventivatore.');
  return moduli;
}

function modulo(tipo: ModuloTipo): ModuloConfigurato {
  return {
    id: `m-${tipo}`,
    tipo,
    larghezzaCm: 80,
    altezzaCm: 100,
    profonditaCm: 40,
    materiale: 'TRUCIOLARE',
    finitura: 'MELAMINICO',
    configurazione: 'APERTO',
    ripiani: 1,
  };
}

describe('Preventivatore — tipo di progetto iniziale', () => {
  it('una composizione di sole librerie si apre come "Libreria"', () => {
    expect(tipoProgettoIniziale(essenziale180())).toBe('LIBRERIA');
  });

  it('senza moduli iniziali resta "Mobile su misura", come sempre', () => {
    expect(tipoProgettoIniziale()).toBe('ALTRO');
    expect(tipoProgettoIniziale([])).toBe('ALTRO');
  });

  it('una composizione con moduli di altro tipo resta "Mobile su misura"', () => {
    expect(tipoProgettoIniziale([modulo('LIBRERIA'), modulo('BASE')])).toBe('ALTRO');
    expect(tipoProgettoIniziale([modulo('BASE')])).toBe('ALTRO');
  });
});

describe('Preventivatore — LIB-ESS-01 non viene alterato dalla prima schermata', () => {
  it('la composizione trasferita è quella della scheda: 2 × 90×220×35, aperto, 5 ripiani', () => {
    const moduli = essenziale180();
    expect(moduli).toHaveLength(2);
    for (const m of moduli) {
      expect(m).toMatchObject({
        tipo: 'LIBRERIA',
        larghezzaCm: 90,
        altezzaCm: 220,
        profonditaCm: 35,
        materiale: 'TRUCIOLARE',
        finitura: 'MELAMINICO',
        configurazione: 'APERTO',
        ripiani: 5,
      });
    }
    // I 10 ripiani della scheda sono 5 per ciascuno dei due moduli.
    expect(moduli.reduce((somma, m) => somma + (m.ripiani ?? 0), 0)).toBe(10);
  });

  it('scegliere "Libreria" (o un tipo equivalente) non tocca alcun modulo né chiede conferma', () => {
    const moduli = essenziale180();
    const copia = structuredClone(moduli);
    for (const tipo of ['LIBRERIA', 'PARETE_ATTREZZATA', 'ALTRO'] as const) {
      for (const m of moduli) {
        const effetto = effettoSceltaTipoProgetto(tipo, m, { composizioneDaConservare: true });
        expect(effetto, `${tipo} su ${m.id}`).toEqual({ tipo: 'NESSUNO' });
        expect(confermaSostituzione(effetto)).toBeNull();
      }
    }
    expect(moduli).toEqual(copia);
  });

  it('una scelta che sostituirebbe i moduli richiede sempre conferma', () => {
    const [primo] = essenziale180();
    const madia = effettoSceltaTipoProgetto('MADIA', primo, { composizioneDaConservare: true });
    expect(madia).toEqual({ tipo: 'CAMBIA_TIPO_MODULO', tipoModulo: 'BASE' });
    expect(confermaSostituzione(madia)).toMatch(/Vuoi continuare\?/);

    const armadio = effettoSceltaTipoProgetto('ARMADIO', primo, { composizioneDaConservare: true });
    expect(armadio).toEqual({ tipo: 'COMPOSIZIONE_ARMADIO' });
    expect(confermaSostituzione(armadio)).toMatch(/tutti i moduli/);
  });
});

describe('Preventivatore — senza composizione iniziale il comportamento non cambia', () => {
  // Mappatura storica della prima schermata, prima di questa modifica.
  const attesi: Record<TipoProgetto, ReturnType<typeof effettoSceltaTipoProgetto>> = {
    ARMADIO: { tipo: 'COMPOSIZIONE_ARMADIO' },
    PARETE_ATTREZZATA: { tipo: 'CAMBIA_TIPO_MODULO', tipoModulo: 'LIBRERIA' },
    MADIA: { tipo: 'CAMBIA_TIPO_MODULO', tipoModulo: 'BASE' },
    LIBRERIA: { tipo: 'CAMBIA_TIPO_MODULO', tipoModulo: 'LIBRERIA' },
    MOBILE_BAGNO: { tipo: 'CAMBIA_TIPO_MODULO', tipoModulo: 'BASE' },
    ALTRO: { tipo: 'NESSUNO' },
  };

  it('ogni scelta prepara i moduli come prima, anche se il tipo corrisponde già', () => {
    for (const corrente of [modulo('BASE'), modulo('LIBRERIA')]) {
      for (const tipo of TUTTI) {
        expect(effettoSceltaTipoProgetto(tipo, corrente), `${tipo} su ${corrente.tipo}`).toEqual(
          attesi[tipo],
        );
        expect(
          effettoSceltaTipoProgetto(tipo, corrente, { composizioneDaConservare: false }),
        ).toEqual(attesi[tipo]);
      }
    }
  });
});
