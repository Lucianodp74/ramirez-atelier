import { describe, expect, it } from 'vitest';
import {
  FAMIGLIE_LIBRERIE,
  MODELLI_LIBRERIE,
  modelliVisibili,
  moduliPerPreventivatore,
  trovaModelloVisibile,
  validaCatalogo,
  type ModelloLibreria,
  type StatoModello,
} from '@/lib/catalogo-librerie/catalogo';
import {
  ingombroComposizione,
  moduliPreventivatoreDa,
  opzioniDisponibili,
  riepilogoElementi,
  validaComposizione,
  type ComposizioneLibreria,
} from '@/lib/catalogo-librerie/composizione';
import { calcolaPreventivoModulare, TARIFFE_DEMO } from '@/lib/preventivatore/prezzo-modulare';
import { validaInputModuli } from '@/lib/preventivatore/validazione-moduli';

const composizione: ComposizioneLibreria = {
  profonditaCm: 40,
  schienale: true,
  materiale: 'TRUCIOLARE',
  finitura: 'MELAMINICO',
  colonne: [
    {
      id: 'c1',
      larghezzaCm: 90,
      vani: [
        { tipo: 'BASE_ANTE', altezzaCm: 80, ante: 2, ripiani: 1 },
        { tipo: 'VANO_APERTO', altezzaCm: 160, ripiani: 3 },
      ],
    },
    {
      id: 'c2',
      larghezzaCm: 60,
      vani: [
        { tipo: 'CASSETTI', altezzaCm: 60, cassetti: 4 },
        { tipo: 'VANO_APERTO', altezzaCm: 140, ripiani: 2 },
      ],
    },
  ],
};

function modelloDiProva(stato: StatoModello, codice = 'LIB-TST-01'): ModelloLibreria {
  return {
    codice,
    nome: 'Modello di prova',
    famiglia: 'ATELIER',
    descrizione: 'Solo per i test.',
    stato,
    dimostrativo: false,
    componibile: false,
    immagini: [],
    composizione,
  };
}

const catalogoDiProva = [
  modelloDiProva('BOZZA', 'LIB-TST-01'),
  modelloDiProva('APPROVATO', 'LIB-TST-02'),
  modelloDiProva('NON_DISPONIBILE', 'LIB-TST-03'),
];

describe('catalogo librerie — coerenza dei dati', () => {
  it('il catalogo consegnato è valido e copre tutte le famiglie', () => {
    expect(validaCatalogo()).toEqual([]);
    for (const famiglia of FAMIGLIE_LIBRERIE) {
      expect(MODELLI_LIBRERIE.some((m) => m.famiglia === famiglia.codice)).toBe(true);
    }
  });

  it('gli esempi dimostrativi sono tutti in bozza e senza immagini presentate come reali', () => {
    for (const modello of MODELLI_LIBRERIE.filter((m) => m.dimostrativo)) {
      expect(modello.stato).toBe('BOZZA');
      expect(modello.immagini.filter((i) => i.tipo === 'APPROVATA')).toEqual([]);
    }
  });

  it('rifiuta un esempio dimostrativo marcato come approvato e i codici duplicati', () => {
    const approvato = { ...modelloDiProva('APPROVATO'), dimostrativo: true };
    expect(validaCatalogo([approvato]).join(' ')).toContain('non può essere approvato');
    expect(validaCatalogo([modelloDiProva('BOZZA'), modelloDiProva('BOZZA')]).join(' ')).toContain(
      'codice duplicato',
    );
  });

  it('non contiene prezzi né costi interni', () => {
    expect(JSON.stringify(MODELLI_LIBRERIE)).not.toMatch(/prezzo|costo|ricarico|margine/i);
  });
});

describe('catalogo librerie — visibilità per stato', () => {
  it('il pubblico non vede le bozze, né in elenco né per codice diretto', () => {
    expect(modelliVisibili({}, catalogoDiProva).map((m) => m.codice)).toEqual([
      'LIB-TST-02',
      'LIB-TST-03',
    ]);
    expect(trovaModelloVisibile('LIB-TST-01', {}, catalogoDiProva)).toBeNull();
    // Stato reale consegnato: nessun modello è ancora approvato.
    expect(modelliVisibili()).toEqual([]);
  });

  it('la sola anteprima interna vede anche le bozze', () => {
    expect(modelliVisibili({ anteprimaInterna: true }, catalogoDiProva)).toHaveLength(3);
    expect(
      trovaModelloVisibile('LIB-TST-01', { anteprimaInterna: true }, catalogoDiProva)?.stato,
    ).toBe('BOZZA');
  });

  it('ignora codici inesistenti o malformati', () => {
    const interno = { anteprimaInterna: true };
    expect(trovaModelloVisibile('LIB-ZZZ-99', interno, catalogoDiProva)).toBeNull();
    expect(trovaModelloVisibile('LIB-TST-01 OR 1=1', interno, catalogoDiProva)).toBeNull();
    expect(trovaModelloVisibile('../admin', interno, catalogoDiProva)).toBeNull();
  });
});

describe('catalogo librerie — collegamento al Preventivatore', () => {
  it('solo un modello approvato apre il Preventivatore per il pubblico', () => {
    expect(moduliPerPreventivatore('LIB-TST-01', {}, catalogoDiProva)).toBeNull();
    expect(moduliPerPreventivatore('LIB-TST-03', {}, catalogoDiProva)).toBeNull();
    expect(moduliPerPreventivatore('LIB-TST-02', {}, catalogoDiProva)).not.toBeNull();
  });

  it('la sola anteprima interna può provare una bozza, mai un modello non disponibile', () => {
    const interno = { anteprimaInterna: true };
    expect(moduliPerPreventivatore('LIB-TST-01', interno, catalogoDiProva)).not.toBeNull();
    expect(moduliPerPreventivatore('LIB-TST-03', interno, catalogoDiProva)).toBeNull();
  });

  it('i moduli generati superano le regole del Preventivatore e portano il codice modello', () => {
    const moduli = moduliPerPreventivatore('LIB-TST-02', {}, catalogoDiProva);
    expect(() => validaInputModuli(moduli)).not.toThrow();
    expect(moduli!.every((m) => m.id.startsWith('LIB-TST-02:'))).toBe(true);
    expect(new Set(moduli!.map((m) => m.id)).size).toBe(moduli!.length);
  });

  it('ogni modello del catalogo è calcolabile dal motore prezzi esistente, senza errori', () => {
    for (const modello of MODELLI_LIBRERIE) {
      const moduli = moduliPreventivatoreDa(modello.codice, modello.composizione);
      expect(() => validaInputModuli(moduli)).not.toThrow();
      expect(calcolaPreventivoModulare(moduli, TARIFFE_DEMO).errori).toEqual([]);
    }
  });

  it('non apre il Preventivatore se la composizione non è più valida', () => {
    const rotto = {
      ...modelloDiProva('APPROVATO'),
      composizione: { ...composizione, profonditaCm: 500 },
    };
    expect(moduliPerPreventivatore('LIB-TST-01', {}, [rotto])).toBeNull();
  });
});

describe('composizione libreria', () => {
  it('calcola ingombro ed elementi dalla struttura', () => {
    expect(ingombroComposizione(composizione)).toEqual({
      larghezzaCm: 150,
      altezzaCm: 240,
      profonditaCm: 40,
    });
    expect(riepilogoElementi(composizione)).toEqual({
      colonne: 2,
      vaniAperti: 2,
      ripiani: 6,
      basiConAnte: 1,
      ante: 2,
      cassettiere: 1,
      cassetti: 4,
      schienale: true,
    });
  });

  it('traduce ogni vano nel tipo di modulo corrispondente', () => {
    expect(
      moduliPreventivatoreDa('LIB-TST-01', composizione).map((m) => [m.tipo, m.configurazione]),
    ).toEqual([
      ['BASE', '2_PORTE'],
      ['LIBRERIA', 'APERTO'],
      ['CASSETTIERA', '4_CASSETTI'],
      ['LIBRERIA', 'APERTO'],
    ]);
  });

  it('segnala strutture incoerenti e misure fuori dai limiti del Preventivatore', () => {
    expect(validaComposizione(composizione)).toEqual([]);
    expect(validaComposizione({ ...composizione, colonne: [] })).toEqual([
      'La composizione non ha colonne.',
    ]);
    const fuoriLimite = {
      ...composizione,
      colonne: [{ id: 'c1', larghezzaCm: 500, vani: composizione.colonne[0].vani }],
    };
    expect(validaComposizione(fuoriLimite).join(' ')).toContain('larghezza fuori limite');
    const anteSuVanoAperto = {
      ...composizione,
      colonne: [
        {
          id: 'c1',
          larghezzaCm: 90,
          vani: [{ tipo: 'VANO_APERTO' as const, altezzaCm: 100, ante: 2 as const }],
        },
      ],
    };
    expect(validaComposizione(anteSuVanoAperto).join(' ')).toContain('solo per le basi');
  });

  it('propone solo materiali e finiture ammessi da tutti i moduli usati', () => {
    const opzioni = opzioniDisponibili(composizione);
    expect(opzioni.materiali).toEqual(['TRUCIOLARE', 'MDF', 'MULTISTRATO']);
    expect(opzioni.finiture).toEqual(['MELAMINICO', 'LAMINATO', 'LACCATO']);
  });
});
