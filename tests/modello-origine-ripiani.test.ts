import { describe, expect, it } from 'vitest';
import type { ModelloLibreria } from '@/lib/catalogo-librerie/catalogo';
import { moduliPreventivatoreDa } from '@/lib/catalogo-librerie/composizione';
import {
  risolviModelloOrigine,
  stessaConfigurazione,
} from '@/lib/catalogo-librerie/modello-origine';
import { CATALOGO_MODULI, type ModuloConfigurato } from '@/lib/preventivatore/moduli';
import { calcolaCostoModulo, TARIFFE_DEMO } from '@/lib/preventivatore/prezzo-modulare';
import { ripianiEffettivi } from '@/lib/preventivatore/ripiani';

// Il motore rifiuta le ante scorrevoli senza tariffa dedicata: valore di sola prova.
const TARIFFE_COMPLETE = { ...TARIFFE_DEMO, ferramentaPerScorrevole: 1 };

const aperto: ModuloConfigurato = {
  id: 'a',
  tipo: 'LIBRERIA',
  larghezzaCm: 90,
  altezzaCm: 200,
  profonditaCm: 40,
  materiale: 'TRUCIOLARE',
  finitura: 'MELAMINICO',
  configurazione: 'APERTO',
};
const chiuso: ModuloConfigurato = { ...aperto, id: 'c', tipo: 'BASE', altezzaCm: 80 };
chiuso.configurazione = '2_PORTE';

const senza = (modulo: ModuloConfigurato): ModuloConfigurato => {
  const copia = { ...modulo };
  delete copia.ripiani;
  return copia;
};
const con = (modulo: ModuloConfigurato, ripiani: number): ModuloConfigurato => ({
  ...modulo,
  ripiani,
});

describe('ripiani effettivi — allineamento con il motore prezzi', () => {
  it('coincide con i ripiani usati dal motore per ogni tipo e configurazione', () => {
    let confrontati = 0;
    for (const catalogo of CATALOGO_MODULI) {
      for (const configurazione of catalogo.configurazioni) {
        for (const ripiani of [undefined, 0, 1, 2, 5]) {
          const modulo: ModuloConfigurato = {
            id: 'm',
            tipo: catalogo.codice,
            larghezzaCm: catalogo.min.larghezzaCm,
            altezzaCm: catalogo.min.altezzaCm,
            profonditaCm: catalogo.min.profonditaCm,
            materiale: catalogo.materiali[0],
            finitura: catalogo.finiture[0],
            configurazione,
            ...(ripiani === undefined ? {} : { ripiani }),
          };
          expect(ripianiEffettivi(modulo), `${catalogo.codice}/${configurazione}/${ripiani}`).toBe(
            calcolaCostoModulo(modulo, TARIFFE_COMPLETE).distinta.ripiani,
          );
          confrontati += 1;
        }
      }
    }
    expect(confrontati).toBeGreaterThan(50);
  });

  it('un valore mancante vale 2 per un modulo aperto e 1 per gli altri, mai zero', () => {
    expect(ripianiEffettivi(senza(aperto))).toBe(2);
    expect(ripianiEffettivi(senza(chiuso))).toBe(1);
    expect(ripianiEffettivi(con(aperto, 0))).toBe(0);
  });
});

describe('stessaConfigurazione — ripiani', () => {
  it('considera uguali ripiani mancanti e il default esplicito corrispondente', () => {
    expect(stessaConfigurazione([senza(aperto)], [con(aperto, 2)])).toBe(true);
    expect(stessaConfigurazione([senza(chiuso)], [con(chiuso, 1)])).toBe(true);
    expect(stessaConfigurazione([senza(aperto)], [senza(aperto)])).toBe(true);
  });

  it('considera diversi ripiani mancanti e zero ripiani espliciti', () => {
    expect(stessaConfigurazione([senza(aperto)], [con(aperto, 0)])).toBe(false);
    expect(stessaConfigurazione([senza(chiuso)], [con(chiuso, 0)])).toBe(false);
  });

  it('considera diversi ripiani mancanti e un valore esplicito diverso dal default', () => {
    expect(stessaConfigurazione([senza(aperto)], [con(aperto, 1)])).toBe(false);
    expect(stessaConfigurazione([senza(chiuso)], [con(chiuso, 2)])).toBe(false);
  });

  it('confronta normalmente i ripiani espliciti', () => {
    expect(stessaConfigurazione([con(aperto, 3)], [con(aperto, 3)])).toBe(true);
    expect(stessaConfigurazione([con(aperto, 3)], [con(aperto, 4)])).toBe(false);
  });

  it('due configurazioni sono uguali solo se il motore le stima allo stesso modo', () => {
    const varianti = [senza(aperto), con(aperto, 0), con(aperto, 1), con(aperto, 2)];
    for (const a of varianti) {
      for (const b of varianti) {
        const stessaStima =
          calcolaCostoModulo(a, TARIFFE_DEMO).costoProduzione ===
          calcolaCostoModulo(b, TARIFFE_DEMO).costoProduzione;
        expect(stessaConfigurazione([a], [b]), `${a.ripiani} / ${b.ripiani}`).toBe(stessaStima);
      }
    }
  });
});

describe("modello d'origine — personalizzazione dei ripiani", () => {
  // La cassettiera generata dal catalogo non indica i ripiani: è il caso reale
  // in cui il vecchio confronto scambiava una modifica per configurazione originale.
  const modello: ModelloLibreria = {
    codice: 'LIB-TST-02',
    nome: 'Modulare di prova',
    famiglia: 'MODULARE',
    descrizione: 'Solo per i test.',
    stato: 'APPROVATO',
    dimostrativo: false,
    componibile: true,
    immagini: [],
    composizione: {
      profonditaCm: 40,
      schienale: true,
      materiale: 'TRUCIOLARE',
      finitura: 'MELAMINICO',
      colonne: [
        {
          id: 'c1',
          larghezzaCm: 90,
          vani: [
            { tipo: 'CASSETTI', altezzaCm: 60, cassetti: 3 },
            { tipo: 'VANO_APERTO', altezzaCm: 160, ripiani: 3 },
          ],
        },
      ],
    },
  };
  const proposti = moduliPreventivatoreDa(modello.codice, modello.composizione);
  const personalizzato = (moduli: ModuloConfigurato[]) =>
    risolviModelloOrigine(modello.codice, moduli, {}, [modello])?.personalizzato;

  it('il modello proposto contiene davvero un modulo senza ripiani indicati', () => {
    expect(proposti[0].tipo).toBe('CASSETTIERA');
    expect(proposti[0].ripiani).toBeUndefined();
  });

  it('la configurazione lasciata com’era resta originale', () => {
    expect(personalizzato(proposti)).toBe(false);
  });

  it('azzerare i ripiani di un modulo che non li indicava è una personalizzazione', () => {
    expect(personalizzato([con(proposti[0], 0), proposti[1]])).toBe(true);
  });

  it('indicare esplicitamente il valore di default non è una personalizzazione', () => {
    expect(personalizzato([con(proposti[0], 1), proposti[1]])).toBe(false);
  });

  it('cambiare i ripiani espliciti del vano aperto è una personalizzazione', () => {
    expect(personalizzato([proposti[0], con(proposti[1], 4)])).toBe(true);
    expect(personalizzato([proposti[0], con(proposti[1], 0)])).toBe(true);
  });
});
