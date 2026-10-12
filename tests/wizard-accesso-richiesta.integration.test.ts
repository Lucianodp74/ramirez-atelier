import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { CAMPI_RISERVATI_RICHIESTA } from '@/lib/richiesta-cliente';

/**
 * Prova d'integrazione del wizard pubblico su PostgreSQL reale: le azioni
 * server vere, il database vero, e al posto del browser un "barattolo" di
 * cookie per ogni cliente simulato. Verifica che l'appartenenza di una
 * richiesta sia decisa dal token di ripresa nel cookie e mai dal solo id.
 *
 * Eseguita solo quando RUN_POSTGRES_INTEGRATION_TESTS=true, su un database
 * locale usa-e-getta già migrato e con il seed applicato.
 */
const enabled = process.env.RUN_POSTGRES_INTEGRATION_TESTS === 'true';
const describePostgres = enabled ? describe : describe.skip;

if (enabled) {
  const url = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
  if (!url || !['localhost', '127.0.0.1'].includes(url.hostname) || !/test/i.test(url.pathname)) {
    throw new Error(
      'Il test del wizard richiede un DATABASE_URL locale con nome contenente "test".',
    );
  }
}

/** Cookie di un browser simulato: ciò che `cookies()` di Next restituirebbe per quella persona. */
class Browser {
  private readonly valori = new Map<string, string>();
  get(nome: string) {
    const value = this.valori.get(nome);
    return value === undefined ? undefined : { name: nome, value };
  }
  set(nome: string, value: string) {
    this.valori.set(nome, value);
  }
  svuota() {
    this.valori.clear();
  }
}

const sessione = vi.hoisted(() => ({ browser: null as unknown }));

vi.mock('next/headers', () => ({
  cookies: async () => sessione.browser,
}));
// Nessun file su disco né su S3: l'archiviazione non è oggetto di questa prova.
vi.mock('@/lib/storage', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/storage')>()),
  getStorageAdapter: () => ({
    carica: async ({ contenuto }: { contenuto: Buffer }) => ({
      storageObjectKey: `memoria/${randomUUID()}`,
      dimensioneByte: contenuto.length,
    }),
  }),
}));

type Azioni = typeof import('@/app/progetti/[chiave]/azioni');
type Db = (typeof import('@/server/db'))['db'];

const suffisso = `${process.env.GITHUB_RUN_ID ?? 'locale'}-${Date.now()}`;
const CHIAVE = `prova-accesso-${suffisso}`;
const COOKIE = `ra_bozza_${CHIAVE}`;
const DOMINIO_EMAIL = `prova-accesso-${suffisso}.test`;
const RIFIUTO = 'Richiesta non trovata.';
/** 32 byte casuali in base64url. */
const TOKEN_SICURO = /^[A-Za-z0-9_-]{43}$/;
/** Formato del vecchio default `cuid()` della colonna. */
const TOKEN_CUID = /^c[a-z0-9]{24}$/;

let db: Db;
let azioni: Azioni;
let riepilogoConToken: typeof import('@/server/services/richiesta-riepilogo-service').recuperaRiepilogoConToken;
let statoPerCliente: typeof import('@/server/services/portale-cliente-service').recuperaStatoPerCliente;
let puntoDiPartenza: typeof import('@/server/services/richieste-service').creaRichiestaDaPuntoDiPartenza;
let tenantId: string;
let tipoProgettoId: string;
let varianteId: string;
let varianteAltroTipoId: string;

function come<T>(browser: Browser, operazione: () => Promise<T>): Promise<T> {
  sessione.browser = browser;
  return operazione();
}

const apriWizard = (browser: Browser, token?: string) =>
  come(browser, () => azioni.iniziaORecuperaBozza(CHIAVE, token));

function fileDiProva(nome = 'pianta.pdf') {
  const formData = new FormData();
  formData.set('file', new File(['contenuto di prova'], nome, { type: 'application/pdf' }));
  return formData;
}

/** Stato reale sul database: ciò che un accesso non autorizzato non deve poter cambiare. */
async function fotografia(richiestaId: string) {
  const richiesta = await db.richiestaProgetto.findUnique({
    where: { id: richiestaId },
    include: { documenti: true },
  });
  return {
    stato: richiesta?.stato,
    dati: richiesta?.datiFormJson,
    nome: richiesta?.clienteNome,
    variante: richiesta?.variantePreimpostataId,
    documenti: richiesta?.documenti.map((d) => d.id).sort(),
  };
}

/** Tutte le azioni che ricevono un id, tentate da `browser` sulla richiesta indicata. */
function tentativi(browser: Browser, richiestaId: string, documentoId: string) {
  return {
    salvaStep: () =>
      come(browser, () => azioni.salvaStep(richiestaId, 'progetto', { descrizione: 'intruso' })),
    registraVarianteSelezionata: () =>
      come(browser, () => azioni.registraVarianteSelezionata(richiestaId, varianteId)),
    caricaDocumento: () => come(browser, () => azioni.caricaDocumento(richiestaId, fileDiProva())),
    eliminaDocumento: () => come(browser, () => azioni.eliminaDocumento(documentoId)),
    completaRichiesta: () => come(browser, () => azioni.completaRichiesta(richiestaId)),
  };
}

async function tuttiRifiutati(browser: Browser, richiestaId: string, documentoId: string) {
  const prima = await fotografia(richiestaId);
  for (const [nome, tentativo] of Object.entries(tentativi(browser, richiestaId, documentoId))) {
    if (nome === 'eliminaDocumento') {
      // Stessa risposta di un allegato inesistente: nessun errore, nessun effetto.
      await expect(tentativo(), nome).resolves.toBeUndefined();
    } else {
      await expect(tentativo(), nome).rejects.toThrow(RIFIUTO);
    }
  }
  expect(await fotografia(richiestaId)).toEqual(prima);
}

/** Bozza di un cliente con un passo compilato e un allegato. */
async function bozzaConAllegato(browser: Browser) {
  const { richiesta } = await apriWizard(browser);
  await come(browser, () =>
    azioni.salvaStep(richiesta.id, 'progetto', { descrizione: 'Libreria a parete' }),
  );
  const documento = await come(browser, () => azioni.caricaDocumento(richiesta.id, fileDiProva()));
  return { richiestaId: richiesta.id, documentoId: documento.id };
}

describePostgres('wizard pubblico — appartenenza della richiesta', () => {
  beforeAll(async () => {
    ({ db } = await import('@/server/db'));
    azioni = await import('@/app/progetti/[chiave]/azioni');
    ({ recuperaRiepilogoConToken: riepilogoConToken } =
      await import('@/server/services/richiesta-riepilogo-service'));

    ({ recuperaStatoPerCliente: statoPerCliente } =
      await import('@/server/services/portale-cliente-service'));
    ({ creaRichiestaDaPuntoDiPartenza: puntoDiPartenza } =
      await import('@/server/services/richieste-service'));

    const tenant = await db.tenant.findUnique({ where: { slug: 'ramirez-atelier' } });
    if (!tenant)
      throw new Error('Tenant di seed assente: eseguire migrazioni e seed prima del test.');
    tenantId = tenant.id;

    const tipoProgetto = await db.tipoProgetto.create({
      data: {
        tenantId,
        chiave: CHIAVE,
        nome: 'Prova accesso wizard',
        configurazione: {
          step: [
            {
              chiave: 'progetto',
              titolo: 'Il progetto',
              campi: [
                {
                  chiave: 'descrizione',
                  etichetta: 'Descrizione',
                  tipo: 'testo',
                  obbligatorio: true,
                  pesoCompletezza: 50,
                },
              ],
            },
            {
              chiave: 'contatti',
              titolo: 'Contatti',
              campi: [
                { chiave: 'clienteNome', etichetta: 'Nome', tipo: 'testo', obbligatorio: true },
                { chiave: 'clienteEmail', etichetta: 'Email', tipo: 'testo', obbligatorio: true },
              ],
            },
          ],
        },
      },
    });
    tipoProgettoId = tipoProgetto.id;

    const altroTipo = await db.tipoProgetto.create({
      data: {
        tenantId,
        chiave: `${CHIAVE}-altro`,
        nome: 'Prova accesso wizard (altro tipo)',
        configurazione: { step: [{ chiave: 'unico', titolo: 'Unico', campi: [] }] },
      },
    });
    const variante = await db.variantePreimpostata.create({
      data: { tenantId, tipoProgettoId, nome: 'Stile di prova', scelte: { stile: 'classico' } },
    });
    varianteId = variante.id;
    const varianteAltroTipo = await db.variantePreimpostata.create({
      data: {
        tenantId,
        tipoProgettoId: altroTipo.id,
        nome: 'Stile di un altro tipo',
        scelte: { stile: 'estraneo' },
      },
    });
    varianteAltroTipoId = varianteAltroTipo.id;
  });

  afterAll(async () => {
    if (!db) return;
    const tipi = { startsWith: CHIAVE };
    await db.richiestaProgetto.deleteMany({ where: { tipoProgetto: { chiave: tipi } } });
    await db.cliente.deleteMany({ where: { email: { endsWith: `@${DOMINIO_EMAIL}` } } });
    await db.variantePreimpostata.deleteMany({ where: { tipoProgetto: { chiave: tipi } } });
    await db.tipoProgetto.deleteMany({ where: { chiave: tipi } });
    await db.$disconnect();
  });

  it('flusso completo del proprio cliente: bozza, passi, allegati, invio, riepilogo', async () => {
    const browser = new Browser();

    const { richiesta } = await apriWizard(browser);
    expect(richiesta.stato).toBe('BOZZA');
    const token = browser.get(COOKIE)?.value;
    expect(token, 'il server deve consegnare il token nel cookie').toBeTruthy();

    const passo = await come(browser, () =>
      azioni.salvaStep(
        richiesta.id,
        'progetto',
        { descrizione: 'Libreria a parete' },
        'avanzamento',
      ),
    );
    expect(passo.errori).toEqual({});

    await come(browser, () => azioni.registraVarianteSelezionata(richiesta.id, varianteId));

    const primo = await come(browser, () => azioni.caricaDocumento(richiesta.id, fileDiProva()));
    await come(browser, () => azioni.eliminaDocumento(primo.id));
    const secondo = await come(browser, () =>
      azioni.caricaDocumento(richiesta.id, fileDiProva('foto.pdf')),
    );

    // Invio senza contatti: rifiutato dalla validazione, la bozza resta bozza.
    const incompleta = await come(browser, () => azioni.completaRichiesta(richiesta.id));
    expect(incompleta.successo).toBe(false);

    await come(browser, () =>
      azioni.salvaStep(richiesta.id, 'contatti', {
        clienteNome: 'Mario Rossi',
        clienteEmail: `mario@${DOMINIO_EMAIL}`,
      }),
    );
    const inviata = await come(browser, () => azioni.completaRichiesta(richiesta.id));
    expect(inviata.successo).toBe(true);

    expect(await fotografia(richiesta.id)).toEqual({
      stato: 'NUOVA',
      dati: { descrizione: 'Libreria a parete', stile: 'classico' },
      nome: 'Mario Rossi',
      variante: varianteId,
      documenti: [secondo.id],
    });

    // La pagina di conferma legge il riepilogo con id + token del cookie.
    const riepilogo = await riepilogoConToken(richiesta.id, token!);
    expect(riepilogo.id).toBe(richiesta.id);
  });

  it('le risposte al browser non contengono mai i campi riservati', async () => {
    const browser = new Browser();
    const apertura = await apriWizard(browser);
    const passo = await come(browser, () =>
      azioni.salvaStep(apertura.richiesta.id, 'progetto', { descrizione: 'x' }),
    );
    // Dati interni scritti dall'area operativa dopo l'apertura della bozza.
    await db.richiestaProgetto.update({
      where: { id: apertura.richiesta.id },
      data: {
        noteInterne: 'nota riservata del titolare',
        datiEstensione: { preventivatoreModulare: { stima: { costoProduzione: 900 } } },
      },
    });
    const ripresa = await apriWizard(browser);
    const dopo = await come(browser, () =>
      azioni.salvaStep(apertura.richiesta.id, 'progetto', { descrizione: 'y' }),
    );

    for (const risposta of [
      apertura.richiesta,
      passo.richiesta,
      ripresa.richiesta,
      dopo.richiesta,
    ]) {
      for (const campo of CAMPI_RISERVATI_RICHIESTA) expect(risposta[campo], campo).toBeNull();
    }
    expect(JSON.stringify([ripresa, dopo])).not.toMatch(/costoProduzione|nota riservata/);
  });

  it('una seconda scheda dello stesso browser lavora sulla stessa bozza', async () => {
    const browser = new Browser();
    const prima = await apriWizard(browser);
    const seconda = await apriWizard(browser);

    expect(seconda.richiesta.id).toBe(prima.richiesta.id);
    await come(browser, () =>
      azioni.salvaStep(seconda.richiesta.id, 'progetto', { descrizione: 'dalla seconda scheda' }),
    );
    expect((await fotografia(prima.richiesta.id)).dati).toEqual({
      descrizione: 'dalla seconda scheda',
    });
  });

  it('chi conosce solo l’id, senza alcun cookie, non può leggere né modificare nulla', async () => {
    const { richiestaId, documentoId } = await bozzaConAllegato(new Browser());

    await tuttiRifiutati(new Browser(), richiestaId, documentoId);
  });

  it('un altro cliente, con la propria bozza e il proprio cookie, non accede a quella altrui', async () => {
    const { richiestaId, documentoId } = await bozzaConAllegato(new Browser());
    const altro = new Browser();
    const sua = await bozzaConAllegato(altro);

    await tuttiRifiutati(altro, richiestaId, documentoId);

    // La propria bozza continua a funzionare normalmente.
    await come(altro, () => azioni.salvaStep(sua.richiestaId, 'progetto', { descrizione: 'mia' }));
    await come(altro, () => azioni.eliminaDocumento(sua.documentoId));
    expect((await fotografia(sua.richiestaId)).documenti).toEqual([]);
  });

  it('un cookie contraffatto o non valido viene rifiutato', async () => {
    const { richiestaId, documentoId } = await bozzaConAllegato(new Browser());
    const vero = (await db.richiestaProgetto.findUnique({ where: { id: richiestaId } }))!
      .tokenRipresa;

    const contraffatti = {
      vuoto: '',
      'id al posto del token': richiestaId,
      'stessa lunghezza, valore diverso': 'x'.repeat(vero.length),
      'token troncato': vero.slice(0, -1),
      'token con un carattere in più': `${vero}a`,
    };
    for (const [caso, valore] of Object.entries(contraffatti)) {
      const browser = new Browser();
      browser.set(COOKIE, valore);
      await expect(
        come(browser, () => azioni.salvaStep(richiestaId, 'progetto', { descrizione: 'x' })),
        caso,
      ).rejects.toThrow(RIFIUTO);
    }

    // Il token giusto, ma nel cookie di un altro tipo di progetto, non vale.
    const cookieSbagliato = new Browser();
    cookieSbagliato.set(`ra_bozza_${CHIAVE}-altro`, vero);
    await tuttiRifiutati(cookieSbagliato, richiestaId, documentoId);
  });

  it('cookie scaduto: la vecchia bozza non è più raggiungibile e se ne apre una nuova', async () => {
    const browser = new Browser();
    const { richiestaId, documentoId } = await bozzaConAllegato(browser);

    browser.svuota();

    await tuttiRifiutati(browser, richiestaId, documentoId);
    const nuova = await apriWizard(browser);
    expect(nuova.richiesta.id).not.toBe(richiestaId);
    expect(nuova.richiesta.datiFormJson).toEqual({});
    // Con il nuovo cookie la vecchia bozza resta comunque fuori portata.
    await tuttiRifiutati(browser, richiestaId, documentoId);
  });

  it('il link di ripresa con il token dà accesso alla bozza anche da un altro browser', async () => {
    const { richiestaId } = await bozzaConAllegato(new Browser());
    const token = (await db.richiestaProgetto.findUnique({ where: { id: richiestaId } }))!
      .tokenRipresa;
    const altroDispositivo = new Browser();

    const ripresa = await apriWizard(altroDispositivo, token);

    expect(ripresa.richiesta.id).toBe(richiestaId);
    await come(altroDispositivo, () =>
      azioni.salvaStep(richiestaId, 'progetto', { descrizione: 'ripresa da link' }),
    );
    expect((await fotografia(richiestaId)).dati).toEqual({ descrizione: 'ripresa da link' });
  });

  it('una richiesta già inviata non è più modificabile, nemmeno dal suo cliente', async () => {
    const browser = new Browser();
    const { richiestaId, documentoId } = await bozzaConAllegato(browser);
    await come(browser, () =>
      azioni.salvaStep(richiestaId, 'contatti', {
        clienteNome: 'Anna Bianchi',
        clienteEmail: `anna@${DOMINIO_EMAIL}`,
      }),
    );
    expect((await come(browser, () => azioni.completaRichiesta(richiestaId))).successo).toBe(true);
    const inviata = await fotografia(richiestaId);
    const prove = tentativi(browser, richiestaId, documentoId);

    await expect(prove.salvaStep()).rejects.toThrow('già stata inviata');
    await expect(prove.registraVarianteSelezionata()).rejects.toThrow('già stata inviata');
    await expect(prove.caricaDocumento()).rejects.toThrow('già stata inviata');
    await expect(prove.eliminaDocumento()).rejects.toThrow('già stata inviata');
    expect(await fotografia(richiestaId)).toEqual(inviata);

    // Un secondo invio (doppio clic) resta un successo, senza dati interni.
    const ripetuto = await prove.completaRichiesta();
    expect(ripetuto.successo).toBe(true);
    if (ripetuto.successo) {
      for (const campo of CAMPI_RISERVATI_RICHIESTA) expect(ripetuto.richiesta[campo]).toBeNull();
    }
  });

  it('una richiesta inviata da un altro cliente non è leggibile conoscendone l’id', async () => {
    const proprietario = new Browser();
    const { richiestaId, documentoId } = await bozzaConAllegato(proprietario);
    await come(proprietario, () =>
      azioni.salvaStep(richiestaId, 'contatti', {
        clienteNome: 'Luca Verdi',
        clienteEmail: `luca@${DOMINIO_EMAIL}`,
      }),
    );
    await come(proprietario, () => azioni.completaRichiesta(richiestaId));

    await tuttiRifiutati(new Browser(), richiestaId, documentoId);
  });

  it('id inesistenti o malformati ricevono lo stesso rifiuto di un id altrui', async () => {
    const browser = new Browser();
    await apriWizard(browser);

    for (const id of ['inesistente', '', 'x'.repeat(500), null, 42, { id: 'a' }]) {
      await expect(
        come(browser, () => azioni.completaRichiesta(id as never)),
        String(id),
      ).rejects.toThrow(RIFIUTO);
    }
    // Un allegato inesistente non è un errore e non rivela nulla.
    await expect(
      come(browser, () => azioni.eliminaDocumento('inesistente')),
    ).resolves.toBeUndefined();
  });

  it('non si può applicare alla propria bozza lo stile di un altro tipo di progetto', async () => {
    const browser = new Browser();
    const { richiesta } = await apriWizard(browser);

    await expect(
      come(browser, () => azioni.registraVarianteSelezionata(richiesta.id, varianteAltroTipoId)),
    ).rejects.toThrow('Variante non trovata.');
    expect((await fotografia(richiesta.id)).variante).toBeNull();
  });

  const tokenReale = async (richiestaId: string) =>
    (await db.richiestaProgetto.findUnique({ where: { id: richiestaId } }))!.tokenRipresa;

  describe('token di ripresa', () => {
    it('ogni nuova bozza riceve un token casuale a 256 bit, mai un cuid', async () => {
      const prima = await apriWizard(new Browser());
      const seconda = await apriWizard(new Browser());
      const [a, b] = await Promise.all([
        tokenReale(prima.richiesta.id),
        tokenReale(seconda.richiesta.id),
      ]);

      for (const token of [a, b]) {
        expect(token).toMatch(TOKEN_SICURO);
        expect(token).not.toMatch(TOKEN_CUID);
      }
      expect(a).not.toBe(b);
    });

    it('il cookie contiene il token, le risposte al browser no', async () => {
      const browser = new Browser();
      const apertura = await apriWizard(browser);
      const id = apertura.richiesta.id;
      const token = await tokenReale(id);
      const passo = await come(browser, () =>
        azioni.salvaStep(id, 'progetto', { descrizione: 'x' }),
      );
      const documento = await come(browser, () => azioni.caricaDocumento(id, fileDiProva()));
      const conAllegato = await come(browser, () =>
        azioni.salvaStep(id, 'contatti', {
          clienteNome: 'Paola Neri',
          clienteEmail: `paola@${DOMINIO_EMAIL}`,
        }),
      );
      const ripresa = await apriWizard(browser);
      const invio = await come(browser, () => azioni.completaRichiesta(id));
      const ripetuto = await come(browser, () => azioni.completaRichiesta(id));

      expect(browser.get(COOKIE)?.value).toBe(token);
      const risposte = { apertura, passo, documento, conAllegato, ripresa, invio, ripetuto };
      for (const [nome, risposta] of Object.entries(risposte)) {
        expect(JSON.stringify(risposta), nome).not.toContain(token);
      }
      for (const richiesta of [apertura.richiesta, passo.richiesta, ripresa.richiesta]) {
        expect(richiesta.tokenRipresa).toBe('');
      }
    });

    it('le risposte non contengono mai il percorso interno degli allegati', async () => {
      const browser = new Browser();
      const { richiesta } = await apriWizard(browser);
      const documento = await come(browser, () =>
        azioni.caricaDocumento(richiesta.id, fileDiProva()),
      );
      const passo = await come(browser, () =>
        azioni.salvaStep(richiesta.id, 'progetto', { descrizione: 'x' }),
      );
      const ripresa = await apriWizard(browser);
      const salvato = await db.documentoRichiesta.findUnique({ where: { id: documento.id } });

      // Nel database il percorso c'è; nelle risposte no.
      expect(salvato!.storageObjectKey).toMatch(/^memoria\//);
      expect(documento.storageObjectKey).toBe('');
      expect(documento.nomeFileOriginale).toBe('pianta.pdf');
      for (const risposta of [documento, passo, ripresa]) {
        expect(JSON.stringify(risposta)).not.toContain(salvato!.storageObjectKey);
      }
      expect(passo.richiesta.documenti).toHaveLength(1);
      expect(ripresa.richiesta.documenti?.[0]?.storageObjectKey).toBe('');
    });

    it('una bozza già esistente con il vecchio token cuid resta riprendibile e utilizzabile', async () => {
      // Come le bozze create prima di questa modifica: token dal default della colonna.
      const vecchia = await db.richiestaProgetto.create({ data: { tenantId, tipoProgettoId } });
      expect(vecchia.tokenRipresa).toMatch(TOKEN_CUID);
      const browser = new Browser();

      const ripresa = await apriWizard(browser, vecchia.tokenRipresa);

      expect(ripresa.richiesta.id).toBe(vecchia.id);
      await come(browser, () =>
        azioni.salvaStep(vecchia.id, 'progetto', { descrizione: 'bozza precedente' }),
      );
      expect((await fotografia(vecchia.id)).dati).toEqual({ descrizione: 'bozza precedente' });
      expect(await statoPerCliente(vecchia.tokenRipresa)).not.toBeNull();
    });

    it('il link pubblico di stato funziona con il nuovo token e solo con quello giusto', async () => {
      const browser = new Browser();
      const { richiestaId } = await bozzaConAllegato(browser);
      await come(browser, () =>
        azioni.salvaStep(richiestaId, 'contatti', {
          clienteNome: 'Sara Blu',
          clienteEmail: `sara@${DOMINIO_EMAIL}`,
        }),
      );
      await come(browser, () => azioni.completaRichiesta(richiestaId));
      const token = await tokenReale(richiestaId);

      expect(token).toMatch(TOKEN_SICURO);
      expect(await statoPerCliente(token)).not.toBeNull();
      expect(await statoPerCliente(richiestaId)).toBeNull();
      expect(await statoPerCliente(token.slice(0, -1))).toBeNull();
      expect((await riepilogoConToken(richiestaId, token)).id).toBe(richiestaId);
    });

    it('il "punto di partenza" creato dall’area operativa nasce con un token sicuro e si riprende dal link', async () => {
      const { richiestaId } = await bozzaConAllegato(new Browser());

      const nuova = await puntoDiPartenza(tenantId, richiestaId);
      const token = await tokenReale(nuova.id);
      const ripresa = await apriWizard(new Browser(), token);

      expect(token).toMatch(TOKEN_SICURO);
      expect(ripresa.richiesta.id).toBe(nuova.id);
    });
  });

  describe('eliminaDocumento — allegato inesistente e allegato altrui indistinguibili', () => {
    it('stessa risposta nei due casi, e l’allegato altrui non viene eliminato', async () => {
      const { richiestaId, documentoId } = await bozzaConAllegato(new Browser());
      const intruso = new Browser();
      await apriWizard(intruso);
      const eventiPrima = await db.eventoAttivita.count({ where: { richiestaId } });

      const esiti = await Promise.allSettled([
        come(intruso, () => azioni.eliminaDocumento(documentoId)),
        come(intruso, () => azioni.eliminaDocumento('allegato-che-non-esiste')),
      ]);

      // Né un errore né un valore diverso distinguono i due casi.
      expect(esiti).toEqual([
        { status: 'fulfilled', value: undefined },
        { status: 'fulfilled', value: undefined },
      ]);
      expect((await fotografia(richiestaId)).documenti).toEqual([documentoId]);
      expect(await db.eventoAttivita.count({ where: { richiestaId } })).toBe(eventiPrima);
    });

    it('vale anche senza alcun cookie e con un cookie contraffatto', async () => {
      const { richiestaId, documentoId } = await bozzaConAllegato(new Browser());
      const contraffatto = new Browser();
      contraffatto.set(COOKIE, 'x'.repeat(43));

      for (const browser of [new Browser(), contraffatto]) {
        await expect(
          come(browser, () => azioni.eliminaDocumento(documentoId)),
        ).resolves.toBeUndefined();
        await expect(
          come(browser, () => azioni.eliminaDocumento('allegato-che-non-esiste')),
        ).resolves.toBeUndefined();
      }
      expect((await fotografia(richiestaId)).documenti).toEqual([documentoId]);
    });

    it('il proprietario elimina il proprio allegato', async () => {
      const browser = new Browser();
      const { richiestaId, documentoId } = await bozzaConAllegato(browser);

      await come(browser, () => azioni.eliminaDocumento(documentoId));

      expect((await fotografia(richiestaId)).documenti).toEqual([]);
    });
  });
});
