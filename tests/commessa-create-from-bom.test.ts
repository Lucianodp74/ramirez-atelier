/**
 * Test REALE di `creaCommessaDaRichiesta` (src/server/services/commessa-service.ts).
 *
 * A differenza di `tests/commessa-create-action.test.ts` (che testa solo un
 * oggetto letterale, non la funzione reale — vedi audit "C6"), questo file
 * importa ed esegue il codice di produzione vero, con `@/server/db` mockato
 * (stesso pattern di `tests/bom-composizione-service.test.ts`), catturando
 * l'esatta sequenza di query eseguite dentro `db.$transaction` e i valori
 * letterali passati a ciascun INSERT.
 *
 * LIMITE AMBIENTALE (documentato, non aggirato): in questo ambiente
 * `npx prisma generate` fallisce (403 su binaries.prisma.sh, allowlist di
 * rete della sessione — vedi audit precedenti), quindi non è disponibile un
 * client Prisma reale né un Postgres realmente raggiungibile da qui per un
 * test di integrazione vero. Di conseguenza:
 *  - i test verificano il comportamento REALE della funzione
 *    (query eseguite, valori copiati, gate di stato, idempotenza e recupero
 *    di una commessa vuota) con `db` mockato: è una verifica reale del codice
 *    applicativo, non della sua interazione con un vero motore transazionale Postgres;
 *  - l'ultimo test ("rollback") verifica SOLO che un errore durante
 *    l'inserimento delle righe si propaghi fuori da `creaCommessaDaRichiesta`
 *    senza essere inghiottito (precondizione necessaria perché il
 *    `db.$transaction` reale di Prisma possa fare rollback) — NON dimostra
 *    che Postgres esegua realmente un rollback fisico, cosa non verificabile
 *    senza un database reale in questo ambiente.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRaw, executeRaw, transaction } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {
    $queryRaw: queryRaw,
    $executeRaw: executeRaw,
    $transaction: transaction,
  },
}));

import { creaCommessaDaRichiesta } from '@/server/services/commessa-service';

const TENANT_ID = 'tenant-1';
const RICHIESTA_ID = 'richiesta-1';

type TxMock = { $queryRaw: typeof queryRaw; $executeRaw: typeof executeRaw };

function installaTransazione() {
  const tx: TxMock = { $queryRaw: queryRaw, $executeRaw: executeRaw };
  transaction.mockImplementation(async (fn: (tx: TxMock) => Promise<unknown>) => fn(tx));
}

const RICHIESTA_CONVERTITA = [
  { id: RICHIESTA_ID, stato: 'CONVERTITA', clienteNome: 'Mario Rossi', tipoProgettoNome: 'Cucina' },
];

function bomConfermata(overrides: Partial<{ id: string; versione: number; stato: string; noteProduzione: string | null }> = {}) {
  return [{ id: 'bom-1', versione: 3, stato: 'CONFERMATA', noteProduzione: 'Attenzione alle finiture', ...overrides }];
}

const RIGHE_BOM = [
  { ordinamento: 0, categoria: 'PANNELLO', codice: 'P-1', descrizione: 'Fianco sinistro', unita: 'pz', quantita: 2, materiale: 'Betulla', lavorazione: 'Taglio + bordatura', costoUnitario: 31.5, note: 'Nota riga 1' },
  { ordinamento: 1, categoria: 'FERRAMENTA', codice: 'F-9', descrizione: 'Cerniera Blum', unita: 'pz', quantita: 4, materiale: null, lavorazione: null, costoUnitario: 6.2, note: null },
];

describe('creaCommessaDaRichiesta — test reale (non mock del risultato)', () => {
  beforeEach(() => {
    queryRaw.mockReset();
    executeRaw.mockReset();
    transaction.mockReset();
    installaTransazione();
  });

  it('crea la commessa quando la richiesta è CONVERTITA e la BOM è CONFERMATA, copiando fonteBomId/fonteBomVersione', async () => {
    queryRaw
      .mockResolvedValueOnce(RICHIESTA_CONVERTITA)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(bomConfermata())
      .mockResolvedValueOnce(RIGHE_BOM);

    const id = await creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID);
    expect(typeof id).toBe('string');

    const insertCommessa = executeRaw.mock.calls.find((call) => String(call[0][0]).includes('INSERT INTO "commessa"'));
    expect(insertCommessa).toBeDefined();
    expect(insertCommessa![2]).toBe(TENANT_ID);
    expect(insertCommessa![3]).toBe(RICHIESTA_ID);
    expect(insertCommessa![5]).toBe('Attenzione alle finiture');
    expect(insertCommessa![6]).toBe('bom-1');
    expect(insertCommessa![7]).toBe(3);
  });

  it('copia integralmente ogni riga BOM nella Commessa: quantità, costoUnitario, materiale, lavorazione, note', async () => {
    queryRaw
      .mockResolvedValueOnce(RICHIESTA_CONVERTITA)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(bomConfermata())
      .mockResolvedValueOnce(RIGHE_BOM);

    await creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID);

    const insertRighe = executeRaw.mock.calls.filter((call) => String(call[0][0]).includes('INSERT INTO "commessa_riga_produzione"'));
    expect(insertRighe).toHaveLength(RIGHE_BOM.length);

    const riga1 = insertRighe[0];
    expect(riga1[2]).toBe(TENANT_ID);
    expect(riga1[4]).toBe(RIGHE_BOM[0].ordinamento);
    expect(riga1[5]).toBe(RIGHE_BOM[0].categoria);
    expect(riga1[6]).toBe(RIGHE_BOM[0].codice);
    expect(riga1[7]).toBe(RIGHE_BOM[0].descrizione);
    expect(riga1[8]).toBe(RIGHE_BOM[0].unita);
    expect(riga1[9]).toBe(RIGHE_BOM[0].quantita);
    expect(riga1[10]).toBe(RIGHE_BOM[0].materiale);
    expect(riga1[11]).toBe(RIGHE_BOM[0].lavorazione);
    expect(riga1[12]).toBe(RIGHE_BOM[0].costoUnitario);
    expect(riga1[13]).toBe(RIGHE_BOM[0].note);

    const riga2 = insertRighe[1];
    expect(riga2[9]).toBe(RIGHE_BOM[1].quantita);
    expect(riga2[10]).toBeNull();
    expect(riga2[11]).toBeNull();
    expect(riga2[12]).toBe(RIGHE_BOM[1].costoUnitario);
    expect(riga2[13]).toBeNull();
  });

  it('rifiuta la creazione se la richiesta non è CONVERTITA, senza eseguire alcun INSERT', async () => {
    queryRaw.mockResolvedValueOnce([{ id: RICHIESTA_ID, stato: 'NUOVA', clienteNome: null, tipoProgettoNome: 'Cucina' }]);

    await expect(creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID)).rejects.toThrow(
      'La commessa può essere creata solo da una richiesta CONVERTITA.',
    );
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('rifiuta la creazione se la BOM esiste ma non è CONFERMATA, senza eseguire alcun INSERT', async () => {
    queryRaw
      .mockResolvedValueOnce(RICHIESTA_CONVERTITA)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(bomConfermata({ stato: 'BOZZA' }));

    await expect(creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID)).rejects.toThrow(
      'La BOM esiste ma non è confermata. Conferma la BOM prima di avviare la commessa.',
    );
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('è idempotente: se una commessa con snapshot esiste già, la restituisce senza modificare nulla', async () => {
    queryRaw
      .mockResolvedValueOnce(RICHIESTA_CONVERTITA)
      .mockResolvedValueOnce([{ id: 'commessa-esistente', righeCount: 7 }]);

    const id = await creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID);
    expect(id).toBe('commessa-esistente');
    expect(executeRaw).not.toHaveBeenCalled();
    expect(queryRaw).toHaveBeenCalledTimes(2);
  });

  it('ripara una commessa già esistente ma vuota quando la BOM viene poi confermata, copiando lo snapshot', async () => {
    queryRaw
      .mockResolvedValueOnce(RICHIESTA_CONVERTITA)
      .mockResolvedValueOnce([{ id: 'commessa-vuota', righeCount: 0 }])
      .mockResolvedValueOnce(bomConfermata())
      .mockResolvedValueOnce(RIGHE_BOM);

    const id = await creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID);
    expect(id).toBe('commessa-vuota');

    const updateCommessa = executeRaw.mock.calls.find((call) => String(call[0][0]).includes('UPDATE "commessa"'));
    expect(updateCommessa).toBeDefined();
    // UPDATE ha quattro interpolazioni dopo la query: fonteBomId, versione,
    // noteProduzione, commessaId. Il tenantId è la quinta interpolazione.
    expect(updateCommessa![1]).toBe('bom-1');
    expect(updateCommessa![2]).toBe(3);

    const insertRighe = executeRaw.mock.calls.filter((call) => String(call[0][0]).includes('INSERT INTO "commessa_riga_produzione"'));
    expect(insertRighe).toHaveLength(RIGHE_BOM.length);
  });

  it('lascia vuota una commessa esistente se la richiesta CONVERTITA non ha ancora una BOM', async () => {
    queryRaw
      .mockResolvedValueOnce(RICHIESTA_CONVERTITA)
      .mockResolvedValueOnce([{ id: 'commessa-vuota', righeCount: 0 }])
      .mockResolvedValueOnce([]);

    const id = await creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID);
    expect(id).toBe('commessa-vuota');
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('crea comunque la commessa (senza righe) se la richiesta CONVERTITA non ha ancora una BOM', async () => {
    queryRaw
      .mockResolvedValueOnce(RICHIESTA_CONVERTITA)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);

    const id = await creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID);
    expect(typeof id).toBe('string');

    const insertCommessa = executeRaw.mock.calls.find((call) => String(call[0][0]).includes('INSERT INTO "commessa"'));
    expect(insertCommessa![6]).toBeNull();
    expect(insertCommessa![7]).toBeNull();
    expect(executeRaw.mock.calls.some((call) => String(call[0][0]).includes('INSERT INTO "commessa_riga_produzione"'))).toBe(false);
  });

  it('non interroga mai il Listino (nessuna query tocca "listino_prezzo"): i costi vengono solo dalla BOM già congelata', async () => {
    queryRaw
      .mockResolvedValueOnce(RICHIESTA_CONVERTITA)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(bomConfermata())
      .mockResolvedValueOnce(RIGHE_BOM);

    await creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID);

    const tutteLeQuery = [...queryRaw.mock.calls, ...executeRaw.mock.calls].map((call) => String(call[0][0]));
    expect(tutteLeQuery.some((sql) => sql.includes('listino_prezzo'))).toBe(false);
  });

  it('isola per tenant: ogni query include il tenantId corretto (nessun accesso incrociato)', async () => {
    queryRaw
      .mockResolvedValueOnce(RICHIESTA_CONVERTITA)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(bomConfermata())
      .mockResolvedValueOnce(RIGHE_BOM);

    await creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID);

    expect(queryRaw.mock.calls[0]).toContain(TENANT_ID);
    expect(queryRaw.mock.calls[1]).toContain(TENANT_ID);
    expect(queryRaw.mock.calls[2]).toContain(TENANT_ID);
  });

  it('LIMITE AMBIENTALE — propaga l\'errore se un INSERT di riga fallisce, senza inghiottirlo (precondizione per il rollback di Prisma; il rollback fisico su Postgres non è verificabile in questo ambiente)', async () => {
    queryRaw
      .mockResolvedValueOnce(RICHIESTA_CONVERTITA)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(bomConfermata())
      .mockResolvedValueOnce(RIGHE_BOM);

    executeRaw
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('violazione vincolo simulata su commessa_riga_produzione'));

    await expect(creaCommessaDaRichiesta(TENANT_ID, RICHIESTA_ID)).rejects.toThrow(
      'violazione vincolo simulata su commessa_riga_produzione',
    );
  });
});
