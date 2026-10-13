import { beforeEach, describe, expect, it, vi } from 'vitest';

const mock = vi.hoisted(() => ({
  crea: vi.fn(),
  evento: vi.fn(),
  executeRaw: vi.fn(),
  calcola: vi.fn(),
  risolvi: vi.fn(),
  anteprima: vi.fn(),
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
vi.mock('@/lib/catalogo-librerie/modello-origine', () => ({
  risolviModelloOrigine: mock.risolvi,
}));
vi.mock('@/server/services/catalogo-librerie-accesso', () => ({
  anteprimaInternaConsentita: mock.anteprima,
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
    mock.anteprima.mockResolvedValue(false);
    mock.risolvi.mockReturnValue(null);
  });

  it('salva il modello convalidato accanto alla configurazione del cliente', async () => {
    mock.risolvi.mockReturnValue(origine);

    await salvaRichiestaPreventivatore(moduli, cliente, { codiceModelloOrigine: 'LIB-ATE-01' });

    expect(mock.risolvi).toHaveBeenCalledWith('LIB-ATE-01', moduli, { anteprimaInterna: false });
    expect(snapshotSalvato().modelloOrigine).toEqual(origine);
    // La configurazione personalizzata resta quella inviata, distinta dal modello.
    expect(snapshotSalvato().moduli).toBe(moduli);
  });

  it("passa alla convalida l'esito reale dell'anteprima interna", async () => {
    mock.anteprima.mockResolvedValue(true);

    await salvaRichiestaPreventivatore(moduli, cliente, { codiceModelloOrigine: 'LIB-ATE-01' });

    expect(mock.risolvi).toHaveBeenCalledWith('LIB-ATE-01', moduli, { anteprimaInterna: true });
  });

  it('un errore tecnico nella verifica della sessione non blocca la richiesta né concede privilegi', async () => {
    mock.anteprima.mockRejectedValue(new Error('Database delle sessioni non raggiungibile'));
    mock.risolvi.mockReturnValue(origine);

    const risultato = await salvaRichiestaPreventivatore(moduli, cliente, {
      codiceModelloOrigine: 'LIB-ATE-01',
    });

    expect(risultato.successo).toBe(true);
    expect(mock.crea).toHaveBeenCalledTimes(1);
    // Solo privilegi pubblici: nessuna bozza ammessa in caso di errore.
    expect(mock.risolvi).toHaveBeenCalledWith('LIB-ATE-01', moduli, { anteprimaInterna: false });
    expect(snapshotSalvato().modelloOrigine).toEqual(origine);
  });

  it('con un errore tecnico la stima, le fasce e la risposta restano quelle senza codice', async () => {
    const senza = await salvaRichiestaPreventivatore(moduli, cliente);
    const datiSenza = mock.crea.mock.calls[0][0].data;
    const scrittureBomSenza = mock.executeRaw.mock.calls.length;
    mock.crea.mockClear();
    mock.executeRaw.mockClear();
    mock.anteprima.mockRejectedValue(new Error('guasto'));
    mock.risolvi.mockReturnValue(origine);
    const con = await salvaRichiestaPreventivatore(moduli, cliente, {
      codiceModelloOrigine: 'LIB-ATE-01',
    });
    const datiCon = mock.crea.mock.calls[0][0].data;

    // bomId è generato a ogni salvataggio: tutto il resto deve coincidere.
    expect({ ...con, bomId: null }).toEqual({ ...senza, bomId: null });
    expect(JSON.stringify(con)).not.toMatch(/costoProduzione|prezzoFalegname|modelloOrigine/);
    expect(datiCon.fasciaPrezzoMin).toBe(datiSenza.fasciaPrezzoMin);
    expect(datiCon.fasciaPrezzoMax).toBe(datiSenza.fasciaPrezzoMax);
    // calcolataIl è l'istante del salvataggio: si confrontano solo gli importi.
    const importi = (dati: typeof datiCon) => {
      const stima = dati.datiEstensione.preventivatoreModulare.stima;
      return [stima.prezzoIndicativo, stima.prezzoFalegname, stima.costoProduzione];
    };
    expect(importi(datiCon)).toEqual(importi(datiSenza));
    // Stessa BOM: stesse scritture e motore di calcolo con soli moduli e tariffe.
    expect(mock.executeRaw.mock.calls.length).toBe(scrittureBomSenza);
    for (const chiamata of mock.calcola.mock.calls) expect(chiamata).toEqual([moduli, {}]);
  });

  it('salva comunque la richiesta, senza il campo, se il codice non è valido', async () => {
    const risultato = await salvaRichiestaPreventivatore(moduli, cliente, {
      codiceModelloOrigine: 'LIB-ZZZ-99',
    });

    expect(risultato.successo).toBe(true);
    expect(snapshotSalvato()).not.toHaveProperty('modelloOrigine');
  });

  it('senza codice si comporta come prima: nessuna convalida, nessun campo', async () => {
    await salvaRichiestaPreventivatore(moduli, cliente);

    expect(mock.risolvi).not.toHaveBeenCalled();
    expect(mock.anteprima).not.toHaveBeenCalled();
    expect(snapshotSalvato()).not.toHaveProperty('modelloOrigine');
    expect(Object.keys(snapshotSalvato()).sort()).toEqual(['moduli', 'stima', 'versione']);
  });

  it('non cambia stima, fascia di prezzo né risposta al browser', async () => {
    const senza = await salvaRichiestaPreventivatore(moduli, cliente);
    const datiSenza = mock.crea.mock.calls[0][0].data;
    mock.crea.mockClear();
    mock.risolvi.mockReturnValue(origine);
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
