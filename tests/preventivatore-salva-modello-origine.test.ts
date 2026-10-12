import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  crea: vi.fn(),
  evento: vi.fn(),
  executeRaw: vi.fn(),
  calcola: vi.fn(),
  modelloOrigine: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {
    tipoProgetto: {
      findMany: vi.fn(async () => [{ id: 'tipo-1', chiave: 'falegnameria', ordinamento: 0 }]),
    },
    $transaction: async (corpo: (tx: unknown) => unknown) =>
      corpo({
        richiestaProgetto: { create: mock.crea },
        eventoAttivita: { create: mock.evento },
        $executeRaw: mock.executeRaw,
      }),
  },
}));
vi.mock('@/server/identity/tenant-corrente', () => ({
  idTenantRamirezAtelier: vi.fn(async () => 'tenant-ramirez'),
}));
vi.mock('@/server/services/preventivatore-listino-service', () => ({
  caricaTariffePreventivatore: vi.fn(async () => ({})),
}));
vi.mock('@/lib/preventivatore/prezzo-modulare', () => ({
  calcolaPreventivoModulare: mock.calcola,
}));
vi.mock('@/lib/preventivatore/validazione-moduli', () => ({ validaInputModuli: vi.fn() }));
vi.mock('@/server/services/modello-origine-service', () => ({
  modelloOriginePerRichiesta: mock.modelloOrigine,
}));

import { salvaRichiestaPreventivatore } from '@/app/preventivatore/azioni';

const moduli = [{ id: 'LIB-ATE-01:c1:1', tipo: 'LIBRERIA' }];
const cliente = { nome: 'Mario Rossi', email: 'mario@example.com' };
const origine = {
  codice: 'LIB-ATE-01',
  nome: 'Atelier 270',
  famiglia: 'ATELIER',
  nomeFamiglia: 'Linea Atelier',
  personalizzato: true,
};

/** Snapshot che l'azione ha chiesto di salvare sulla richiesta. */
function snapshotSalvato() {
  return mock.crea.mock.calls[0][0].data.datiEstensione.preventivatoreModulare;
}

describe("salvaRichiestaPreventivatore — modello d'origine", () => {
  beforeEach(() => {
    for (const funzione of Object.values(mock)) funzione.mockReset();
    mock.crea.mockResolvedValue({ id: 'richiesta-1', tokenRipresa: 'token-1' });
    mock.calcola.mockReturnValue({
      righe: [],
      costoProduzione: 900,
      prezzoFalegname: 1100,
      prezzoIndicativo: 1540,
      errori: [],
    });
    mock.modelloOrigine.mockResolvedValue(null);
  });

  it('salva il modello convalidato accanto alla configurazione del cliente', async () => {
    mock.modelloOrigine.mockResolvedValue(origine);

    await salvaRichiestaPreventivatore(moduli, cliente, { codiceModelloOrigine: 'LIB-ATE-01' });

    expect(mock.modelloOrigine).toHaveBeenCalledWith('LIB-ATE-01', moduli);
    expect(snapshotSalvato().modelloOrigine).toEqual(origine);
    // La configurazione personalizzata resta quella inviata, distinta dal modello.
    expect(snapshotSalvato().moduli).toBe(moduli);
  });

  it('salva comunque la richiesta, senza il campo, se il modello non è registrabile', async () => {
    const risultato = await salvaRichiestaPreventivatore(moduli, cliente, {
      codiceModelloOrigine: 'LIB-ZZZ-99',
    });

    expect(risultato.successo).toBe(true);
    expect(mock.crea).toHaveBeenCalledOnce();
    expect(snapshotSalvato()).not.toHaveProperty('modelloOrigine');
  });

  it('senza codice si comporta come prima: nessuna convalida, nessun campo', async () => {
    await salvaRichiestaPreventivatore(moduli, cliente);

    expect(mock.modelloOrigine).not.toHaveBeenCalled();
    expect(snapshotSalvato()).not.toHaveProperty('modelloOrigine');
    expect(Object.keys(snapshotSalvato()).sort()).toEqual(['moduli', 'stima', 'versione']);
  });

  it('opzioni malformate dal browser non impediscono il salvataggio', async () => {
    for (const opzioni of [null, 'LIB-ATE-01', 42, [], { codiceModelloOrigine: '' }]) {
      mock.crea.mockClear();
      const risultato = await salvaRichiestaPreventivatore(moduli, cliente, opzioni as never);

      expect(risultato.successo, JSON.stringify(opzioni)).toBe(true);
      expect(snapshotSalvato()).not.toHaveProperty('modelloOrigine');
    }
    expect(mock.modelloOrigine).not.toHaveBeenCalled();
  });

  it('non cambia stima, fascia di prezzo né risposta al browser', async () => {
    const senza = await salvaRichiestaPreventivatore(moduli, cliente);
    const datiSenza = mock.crea.mock.calls[0][0].data;
    mock.crea.mockClear();
    mock.modelloOrigine.mockResolvedValue(origine);
    const con = await salvaRichiestaPreventivatore(moduli, cliente, {
      codiceModelloOrigine: 'LIB-ATE-01',
    });
    const datiCon = mock.crea.mock.calls[0][0].data;

    // bomId è generato a ogni salvataggio: tutto il resto deve coincidere.
    expect({ ...con, bomId: null }).toEqual({ ...senza, bomId: null });
    expect(Object.keys(con).sort()).toEqual(Object.keys(senza).sort());
    expect(JSON.stringify(con)).not.toMatch(/costoProduzione|prezzoFalegname|modelloOrigine/);
    expect(datiCon.fasciaPrezzoMin).toBe(datiSenza.fasciaPrezzoMin);
    expect(datiCon.fasciaPrezzoMax).toBe(datiSenza.fasciaPrezzoMax);
    // calcolataIl è l'istante del salvataggio: si confrontano solo gli importi.
    const importi = (dati: typeof datiCon) => {
      const stima = dati.datiEstensione.preventivatoreModulare.stima;
      return [stima.prezzoIndicativo, stima.prezzoFalegname, stima.costoProduzione];
    };
    expect(importi(datiCon)).toEqual(importi(datiSenza));
    // Il motore di calcolo riceve solo moduli e tariffe: mai il modello.
    for (const chiamata of mock.calcola.mock.calls) expect(chiamata).toEqual([moduli, {}]);
  });
});
