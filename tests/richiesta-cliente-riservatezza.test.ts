import { beforeEach, describe, expect, it, vi } from 'vitest';

const trovaRichiesta = vi.hoisted(() => vi.fn());
/** Cookie presentati dal browser che invoca l'azione. */
const browser = vi.hoisted(() => ({ cookie: {} as Record<string, string> }));

vi.mock('@/server/db', () => ({
  db: { richiestaProgetto: { findUnique: trovaRichiesta } },
}));
vi.mock('next/headers', () => ({
  cookies: async () => ({
    get: (nome: string) =>
      nome in browser.cookie ? { name: nome, value: browser.cookie[nome] } : undefined,
  }),
}));
vi.mock('@/lib/storage', () => ({ getStorageAdapter: vi.fn(), determinaCategoria: vi.fn() }));
vi.mock('@/lib/notifiche', () => ({ getEmailAdapter: vi.fn() }));
vi.mock('@/lib/rule-engine/bootstrap', () => ({ assicuraGestoriRegistrati: vi.fn() }));
vi.mock('@/lib/rule-engine/motore', () => ({ eseguiRegolePerContesto: vi.fn() }));
vi.mock('@/server/identity/tenant-corrente', () => ({ idTenantRamirezAtelier: vi.fn() }));
vi.mock('@/server/services/variante-preimpostata-service', () => ({
  variantiAttivePerTipoProgetto: vi.fn(),
}));
vi.mock('@/server/services/cliente-service', () => ({ trovaOCreaCliente: vi.fn() }));
vi.mock('@/lib/configurazione-dinamica', () => ({ risolviConfigurazioneDinamica: vi.fn() }));

import * as azioniWizard from '@/app/progetti/[chiave]/azioni';
import * as azioniPreventivatore from '@/app/preventivatore/azioni';
import { CAMPI_RISERVATI_RICHIESTA, datiPerCliente } from '@/lib/richiesta-cliente';

/** Una richiesta già lavorata dall'atelier, con tutto ciò che il cliente non deve vedere. */
const richiestaInviata = {
  id: 'richiesta-1',
  tokenRipresa: 'token-di-ripresa-del-cliente',
  tenantId: 'tenant-ramirez',
  stato: 'PREVENTIVO_INVIATO',
  clienteNome: 'Mario Rossi',
  clienteEmail: 'mario@example.com',
  datiFormJson: { origine: 'preventivatore-modulare-v2' },
  fasciaPrezzoMin: 1540,
  fasciaPrezzoMax: 1540,
  noteInterne: 'Cliente difficile, margine da tenere alto',
  prioritaCommerciale: 'ALTA',
  regolaPrezzoApplicataId: 'regola-interna-7',
  datiEstensione: {
    preventivatoreModulare: {
      versione: 2,
      moduli: [],
      stima: { prezzoIndicativo: 1540, prezzoFalegname: 1100, costoProduzione: 900 },
    },
    preventivo: { versione: 1, pricing: { ricaricoPercentuale: 40, costoTotale: 900 } },
  },
  tipoProgetto: { id: 'tipo-1', chiave: 'falegnameria', nome: 'Falegnameria', configurazione: {} },
};

const DATI_INTERNI =
  /costoProduzione|prezzoFalegname|ricaricoPercentuale|costoTotale|margine|regola-interna/i;

describe('datiPerCliente', () => {
  it('azzera tutti i campi riservati e lascia intatti i dati del cliente', () => {
    const pubblica = datiPerCliente(richiestaInviata);

    for (const campo of CAMPI_RISERVATI_RICHIESTA) expect(pubblica[campo], campo).toBeNull();
    expect(JSON.stringify(pubblica)).not.toMatch(DATI_INTERNI);
    expect(pubblica.clienteNome).toBe('Mario Rossi');
    expect(pubblica.fasciaPrezzoMin).toBe(1540);
    expect(pubblica.tipoProgetto).toEqual(richiestaInviata.tipoProgetto);
  });

  it('svuota il token di ripresa e il percorso interno degli allegati', () => {
    const conAllegati = {
      ...richiestaInviata,
      documenti: [
        {
          id: 'doc-1',
          nomeFileOriginale: 'pianta.pdf',
          storageObjectKey: 'tenant/richiesta/pianta.pdf',
        },
      ],
    };

    const pubblica = datiPerCliente(conAllegati);

    expect(pubblica.tokenRipresa).toBe('');
    expect(pubblica.documenti).toEqual([
      { id: 'doc-1', nomeFileOriginale: 'pianta.pdf', storageObjectKey: '' },
    ]);
    expect(JSON.stringify(pubblica)).not.toMatch(/token-di-ripresa|tenant\/richiesta/);
    // L'originale, usato dal server per il cookie, resta intatto.
    expect(conAllegati.tokenRipresa).toBe('token-di-ripresa-del-cliente');
    expect(conAllegati.documenti[0].storageObjectKey).toBe('tenant/richiesta/pianta.pdf');
  });

  it('non modifica la richiesta originale', () => {
    datiPerCliente(richiestaInviata);

    expect(richiestaInviata.noteInterne).toContain('margine');
    expect(richiestaInviata.datiEstensione.preventivatoreModulare.stima.costoProduzione).toBe(900);
  });

  it('mantiene la stessa forma: nessun campo sparisce', () => {
    expect(Object.keys(datiPerCliente(richiestaInviata)).sort()).toEqual(
      Object.keys(richiestaInviata).sort(),
    );
  });
});

describe('azioni pubbliche — nessun dato interno al browser', () => {
  beforeEach(() => {
    trovaRichiesta.mockReset();
    browser.cookie = {};
  });

  it('completaRichiesta su una richiesta già inviata non restituisce costi né note interne', async () => {
    trovaRichiesta.mockResolvedValue(richiestaInviata);
    browser.cookie = { ra_bozza_falegnameria: 'token-di-ripresa-del-cliente' };

    // Anche il cliente proprietario, con il suo cookie, non deve ricevere i
    // dati dell'area operativa della propria richiesta.
    const risposta = await azioniWizard.completaRichiesta('richiesta-1');

    expect(risposta.successo).toBe(true);
    expect(JSON.stringify(risposta)).not.toMatch(DATI_INTERNI);
    if (!risposta.successo) throw new Error('risposta inattesa');
    expect(risposta.richiesta.datiEstensione).toBeNull();
    expect(risposta.richiesta.noteInterne).toBeNull();
    expect(risposta.richiesta.prioritaCommerciale).toBeNull();
    expect(risposta.richiesta.regolaPrezzoApplicataId).toBeNull();
  });

  it('completaRichiesta rifiuta chi conosce l’id ma non presenta il token di ripresa', async () => {
    trovaRichiesta.mockResolvedValue(richiestaInviata);

    await expect(azioniWizard.completaRichiesta('richiesta-1')).rejects.toThrow(
      'Richiesta non trovata.',
    );

    browser.cookie = { ra_bozza_falegnameria: 'token-di-un-altro-cliente!!!' };
    await expect(azioniWizard.completaRichiesta('richiesta-1')).rejects.toThrow(
      'Richiesta non trovata.',
    );

    // Il token giusto nel cookie di un altro tipo di progetto non vale.
    browser.cookie = { ra_bozza_cucina: 'token-di-ripresa-del-cliente' };
    await expect(azioniWizard.completaRichiesta('richiesta-1')).rejects.toThrow(
      'Richiesta non trovata.',
    );
  });

  it('non esiste più un’azione pubblica che restituisce la richiesta dato il solo id', () => {
    expect(azioniWizard).not.toHaveProperty('recuperaRiepilogo');
  });

  it('l’elenco delle azioni pubbliche è quello atteso: una nuova va valutata prima di esporla', () => {
    expect(Object.keys(azioniWizard).sort()).toEqual([
      'caricaDocumento',
      'completaRichiesta',
      'eliminaDocumento',
      'iniziaORecuperaBozza',
      'registraVarianteSelezionata',
      'salvaStep',
    ]);
    expect(Object.keys(azioniPreventivatore).sort()).toEqual([
      'calcolaStimaPreventivatore',
      'salvaRichiestaPreventivatore',
    ]);
  });
});
