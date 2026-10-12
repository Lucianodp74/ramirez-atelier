import { describe, expect, it } from 'vitest';
import type { ModelloLibreria, StatoModello } from '@/lib/catalogo-librerie/catalogo';
import { moduliPreventivatoreDa } from '@/lib/catalogo-librerie/composizione';
import {
  leggiModelloOrigine,
  risolviModelloOrigine,
  stessaConfigurazione,
} from '@/lib/catalogo-librerie/modello-origine';

function modello(stato: StatoModello, codice: string): ModelloLibreria {
  return {
    codice,
    nome: 'Atelier di prova',
    famiglia: 'ATELIER',
    descrizione: 'Solo per i test.',
    stato,
    dimostrativo: false,
    componibile: false,
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
            { tipo: 'BASE_ANTE', altezzaCm: 80, ante: 2, ripiani: 1 },
            { tipo: 'VANO_APERTO', altezzaCm: 160, ripiani: 3 },
          ],
        },
      ],
    },
  };
}

const catalogo = [
  modello('BOZZA', 'LIB-TST-01'),
  modello('APPROVATO', 'LIB-TST-02'),
  modello('NON_DISPONIBILE', 'LIB-TST-03'),
];
const proposti = (codice: string) =>
  moduliPreventivatoreDa(codice, catalogo.find((m) => m.codice === codice)!.composizione);

describe("modello d'origine — convalida al salvataggio", () => {
  it('riporta codice, nome e famiglia di un modello approvato lasciato com’era', () => {
    expect(risolviModelloOrigine('LIB-TST-02', proposti('LIB-TST-02'), {}, catalogo)).toEqual({
      codice: 'LIB-TST-02',
      nome: 'Atelier di prova',
      famiglia: 'ATELIER',
      nomeFamiglia: 'Linea Atelier',
      personalizzato: false,
    });
  });

  it('segna come personalizzata una configurazione cambiata dal cliente', () => {
    const base = proposti('LIB-TST-02');
    const casi = {
      'misura cambiata': base.map((m, i) => (i === 0 ? { ...m, larghezzaCm: 120 } : m)),
      'finitura cambiata': base.map((m) => ({ ...m, finitura: 'LACCATO' as const })),
      'modulo rimosso': base.slice(1),
      'modulo aggiunto': [...base, { ...base[0], id: 'nuovo' }],
    };
    for (const [nome, moduli] of Object.entries(casi)) {
      const origine = risolviModelloOrigine('LIB-TST-02', moduli, {}, catalogo);
      expect(origine?.personalizzato, nome).toBe(true);
      expect(origine?.codice, nome).toBe('LIB-TST-02');
    }
  });

  it('non considera personalizzazione il solo cambio degli identificativi dei moduli', () => {
    const rinominati = proposti('LIB-TST-02').map((m, i) => ({ ...m, id: `altro-${i}` }));
    expect(stessaConfigurazione(rinominati, proposti('LIB-TST-02'))).toBe(true);
    expect(risolviModelloOrigine('LIB-TST-02', rinominati, {}, catalogo)?.personalizzato).toBe(
      false,
    );
  });

  it('ignora bozze e modelli non disponibili per il pubblico', () => {
    expect(risolviModelloOrigine('LIB-TST-01', proposti('LIB-TST-01'), {}, catalogo)).toBeNull();
    expect(risolviModelloOrigine('LIB-TST-03', proposti('LIB-TST-03'), {}, catalogo)).toBeNull();
  });

  it("accetta una bozza solo dall'anteprima interna, mai un modello non disponibile", () => {
    const interno = { anteprimaInterna: true };
    expect(
      risolviModelloOrigine('LIB-TST-01', proposti('LIB-TST-01'), interno, catalogo)?.codice,
    ).toBe('LIB-TST-01');
    expect(
      risolviModelloOrigine('LIB-TST-03', proposti('LIB-TST-03'), interno, catalogo),
    ).toBeNull();
  });

  it('ignora codici assenti, inesistenti, malformati o non testuali', () => {
    const moduli = proposti('LIB-TST-02');
    for (const codice of [undefined, null, '', 'LIB-ZZZ-99', 'LIB-TST-02 ', '<script>', 42, {}]) {
      expect(
        risolviModelloOrigine(codice, moduli, { anteprimaInterna: true }, catalogo),
      ).toBeNull();
    }
  });

  it('non contiene prezzi né costi', () => {
    const origine = risolviModelloOrigine('LIB-TST-02', proposti('LIB-TST-02'), {}, catalogo);
    expect(JSON.stringify(origine)).not.toMatch(/prezzo|costo|ricarico|margine/i);
  });
});

describe("modello d'origine — lettura dalla richiesta salvata", () => {
  const salvato = {
    codice: 'LIB-TST-02',
    nome: 'Atelier di prova',
    famiglia: 'ATELIER',
    nomeFamiglia: 'Linea Atelier',
    personalizzato: true,
  };
  const estensione = (modelloOrigine: unknown) => ({
    preventivatoreModulare: { versione: 2, moduli: [], modelloOrigine },
  });

  it('restituisce il campo così come è stato salvato', () => {
    expect(leggiModelloOrigine(estensione(salvato))).toEqual(salvato);
  });

  it('resta leggibile anche se il modello non esiste più nel catalogo', () => {
    expect(leggiModelloOrigine(estensione({ ...salvato, codice: 'LIB-OLD-07' }))?.codice).toBe(
      'LIB-OLD-07',
    );
  });

  it('restituisce null per richieste senza modello d’origine o con dati malformati', () => {
    const senzaCampo = { preventivatoreModulare: { versione: 2, moduli: [] } };
    for (const dati of [
      null,
      undefined,
      'testo',
      [],
      {},
      { preventivatoreModulare: null },
      senzaCampo,
      estensione('LIB-TST-02'),
      estensione({ ...salvato, codice: 'non-un-codice' }),
      estensione({ ...salvato, nome: 12 }),
    ]) {
      expect(leggiModelloOrigine(dati)).toBeNull();
    }
  });

  it('tratta come non personalizzato un indicatore assente o non booleano', () => {
    expect(
      leggiModelloOrigine(estensione({ ...salvato, personalizzato: 'sì' }))?.personalizzato,
    ).toBe(false);
  });
});
