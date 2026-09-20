/**
 * Test REALE del gate IN_PRODUZIONE → PRONTA di `cambiaStatoCommessa`
 * (src/server/services/commessa-service.ts), dopo la correzione "C1"
 * (race condition fra il controllo delle righe incomplete e il cambio di
 * stato — vedi audit "Audit end-to-end: BOM → Commessa → Produzione →
 * Consegna → KPI").
 *
 * La correzione rende il controllo e la scrittura un'unica UPDATE SQL
 * (`UPDATE ... WHERE ... AND NOT EXISTS (...)`), quindi non c'è più un
 * secondo round-trip applicativo fra "leggo se ci sono righe incomplete" e
 * "scrivo PRONTA" in cui un'altra richiesta possa inserirsi.
 *
 * LIMITE AMBIENTALE (documentato, non aggirato): senza un Postgres reale
 * raggiungibile in questo ambiente (client Prisma non generabile, vedi
 * audit precedenti), non è possibile eseguire due connessioni concorrenti
 * reali contro lo stesso database e osservare a occhio la serializzazione a
 * livello di riga che Postgres applica a una singola istruzione UPDATE.
 * Quello che i test qui sotto dimostrano concretamente è:
 *  (a) il comportamento funzionale del gate (righe incomplete → rifiutato;
 *      tutte complete → accettato), con `db` mockato;
 *  (b) che il controllo "nessuna riga incompleta" e la scrittura dello stato
 *      sono ora la stessa, singola query SQL (una sola chiamata a
 *      `$queryRaw`, non un `SELECT` separato seguito da un `UPDATE`) — è
 *      questo, e non un test di concorrenza reale, che elimina la finestra
 *      di race descritta nell'audit: non c'è più un punto fra le due
 *      operazioni in cui il codice applicativo possa essere interrotto.
 *  Un test di concorrenza vera (due transazioni Postgres reali in corsa)
 *  richiederebbe un database reale e non è stato falsificato qui: è
 *  esplicitamente dichiarato come non eseguito.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRaw, executeRaw } = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: { $queryRaw: queryRaw, $executeRaw: executeRaw },
}));

import { cambiaStatoCommessa } from '@/server/services/commessa-service';

const TENANT_ID = 'tenant-1';
const COMMESSA_ID = 'commessa-1';

function dettaglioMock() {
  // dettaglioCommessa esegue 2 query: intestazione + righe.
  queryRaw
    .mockResolvedValueOnce([{ id: COMMESSA_ID, tenantId: TENANT_ID, richiestaId: 'r-1', numero: 'COM-2026-X', stato: 'PRONTA', noteProduzione: null, fonteBomId: null, fonteBomVersione: null, dataPrevistaConsegna: null, avviataIl: new Date(), prontaIl: new Date(), consegnataIl: null, chiusaIl: null, createdAt: new Date(), updatedAt: new Date(), clienteNome: null, clienteEmail: null, clienteTelefono: null, tipoProgettoNome: 'Cucina' }])
    .mockResolvedValueOnce([]);
}

describe('cambiaStatoCommessa — gate IN_PRODUZIONE → PRONTA (dopo fix C1)', () => {
  beforeEach(() => {
    queryRaw.mockReset();
    executeRaw.mockReset();
  });

  it('rifiuta la transizione a PRONTA se esiste almeno una riga di produzione non COMPLETATA', async () => {
    queryRaw
      .mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'IN_PRODUZIONE' }]) // SELECT stato corrente
      .mockResolvedValueOnce([]); // UPDATE ... RETURNING "id": nessuna riga aggiornata (NOT EXISTS falso)

    await expect(cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'PRONTA')).rejects.toThrow(
      'La commessa non può essere segnata come pronta: completa prima tutte le righe di produzione.',
    );

    // La UPDATE con il gate deve essere stata tentata (e deve essere l'unica
    // query di scrittura/controllo per il gate: niente SELECT separato prima).
    const updatePronta = queryRaw.mock.calls.find((call) => String(call[0].join('')).includes("SET \"stato\" = 'PRONTA'"));
    expect(updatePronta).toBeDefined();
    expect(String(updatePronta![0].join(''))).toContain('NOT EXISTS');
    expect(String(updatePronta![0].join(''))).toContain('statoLavorazione');
  });

  it('accetta la transizione a PRONTA quando tutte le righe di produzione sono COMPLETATA', async () => {
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'IN_PRODUZIONE' }]); // SELECT stato corrente
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID }]); // UPDATE ... RETURNING "id": la riga è stata aggiornata
    dettaglioMock();

    const risultato = await cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'PRONTA');
    expect(risultato?.stato).toBe('PRONTA');
  });

  it('controllo e scrittura sono un\'unica query atomica: non esiste più un SELECT del conteggio separato dalla UPDATE', async () => {
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'IN_PRODUZIONE' }]);
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID }]);
    dettaglioMock();

    await cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'PRONTA');

    // Prima della correzione, il gate era: 1 SELECT (stato) + 1 SELECT COUNT(*)
    // + 1 UPDATE = 3 query. Ora è: 1 SELECT (stato) + 1 sola UPDATE con NOT
    // EXISTS incorporato = 2 query, prima delle 2 di dettaglioCommessa.
    const queryDelGate = queryRaw.mock.calls.slice(0, 2).map((call) => String(call[0].join('')));
    expect(queryDelGate.some((sql) => sql.trim().startsWith('SELECT COUNT(*)'))).toBe(false);
    expect(queryDelGate.some((sql) => sql.includes('UPDATE "commessa"') && sql.includes('NOT EXISTS'))).toBe(true);
  });

  it('preserva le transizioni esistenti: PRONTA → PRONTA resta comunque rifiutata (invariato rispetto a prima della correzione)', async () => {
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'PRONTA' }]);
    await expect(cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'PRONTA')).rejects.toThrow(
      'Transizione commessa non consentita: PRONTA → PRONTA.',
    );
    expect(executeRaw).not.toHaveBeenCalled();
  });

  it('isola per tenant: la UPDATE del gate include sempre il tenantId', async () => {
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'IN_PRODUZIONE' }]);
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID }]);
    dettaglioMock();

    await cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'PRONTA');
    const updatePronta = queryRaw.mock.calls.find((call) => String(call[0].join('')).includes("SET \"stato\" = 'PRONTA'"));
    expect(updatePronta).toContain(TENANT_ID);
  });

  it('le altre transizioni (es. DA_AVVIARE → IN_PRODUZIONE) restano invariate: nessuna UPDATE con NOT EXISTS', async () => {
    queryRaw.mockResolvedValueOnce([{ id: COMMESSA_ID, stato: 'DA_AVVIARE' }]);
    executeRaw.mockResolvedValueOnce(undefined);
    dettaglioMock();

    await cambiaStatoCommessa(TENANT_ID, COMMESSA_ID, 'IN_PRODUZIONE');

    expect(executeRaw).toHaveBeenCalledTimes(1);
    expect(String(executeRaw.mock.calls[0][0].join(''))).not.toContain('NOT EXISTS');
    expect(String(executeRaw.mock.calls[0][0].join(''))).toContain('avviataIl');
  });
});
