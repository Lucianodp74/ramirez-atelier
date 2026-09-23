/**
 * Test REALE del servizio `progetto-preimpostato-service.ts` (COMPOSIZIONI /
 * CATALOGO V1). Esegue il codice di produzione reale (inclusa la vera
 * `validaInputModuli`/`validaModulo` già usata dal Preventivatore, non
 * mockata) con `@/server/db` mockato a livello di delegate Prisma
 * (`db.progettoPreimpostato.*`), lo stesso pattern già in uso nel repo per
 * `@/server/db` con `$queryRaw`/`$executeRaw` (vedi
 * `tests/listino-prezzi-service.test.ts`), esteso qui alle chiamate al
 * client Prisma (`findMany`/`findUnique`/`findFirst`/`create`/`update`/
 * `delete`) dato che questo servizio, come `variante-preimpostata-service.ts`
 * da cui è ricalcato, non usa SQL raw.
 *
 * Copre in particolare:
 *  - riuso reale della validazione esistente (nessuna regola duplicata):
 *    un modulo fuori dai limiti del catalogo tecnico viene rifiutato;
 *  - isolamento per tenant (ownership check) su aggiornamento/eliminazione;
 *  - `recuperaProgettoPreimpostatoPubblicato` non espone mai un progetto non
 *    pubblicato o di un altro tenant, e non lancia mai un'eccezione verso il
 *    chiamante pubblico se i moduli salvati non sono più validi (torna
 *    `null` invece di rompere la pagina).
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { findMany, findUnique, findFirst, create, update, delete: deleteMock } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/server/db', () => ({
  db: {
    progettoPreimpostato: { findMany, findUnique, findFirst, create, update, delete: deleteMock },
  },
}));

import {
  creaProgettoPreimpostato,
  aggiornaProgettoPreimpostato,
  eliminaProgettoPreimpostato,
  impostaPubblicazioneProgettoPreimpostato,
  recuperaProgettoPreimpostatoPubblicato,
  elencoProgettiPreimpostati,
} from '@/server/services/progetto-preimpostato-service';

const TENANT = 'tenant-1';

// Modulo valido per il catalogo tecnico reale (src/lib/preventivatore/moduli.ts,
// famiglia BASE: 30-180 x 60-120 x 30-70 cm, TRUCIOLARE/MDF/MULTISTRATO,
// MELAMINICO/LAMINATO/LACCATO) - stesso identico formato del Preventivatore.
const MODULO_VALIDO = {
  id: 'm1', tipo: 'BASE', larghezzaCm: 80, altezzaCm: 90, profonditaCm: 40,
  materiale: 'MDF', finitura: 'LAMINATO', configurazione: 'APERTO', ripiani: 2,
};
const MODULO_FUORI_LIMITI = { ...MODULO_VALIDO, id: 'm2', larghezzaCm: 999 };

beforeEach(() => {
  findMany.mockReset(); findUnique.mockReset(); findFirst.mockReset();
  create.mockReset(); update.mockReset(); deleteMock.mockReset();
});

describe('creaProgettoPreimpostato', () => {
  it('rifiuta moduli fuori dai limiti del catalogo tecnico (riuso reale di validaModulo, nessuna regola duplicata)', async () => {
    await expect(
      creaProgettoPreimpostato(TENANT, { nome: 'Test', categoria: 'ARMADIO', moduli: [MODULO_FUORI_LIMITI as never] }),
    ).rejects.toThrow(/fuori limite/);
    expect(create).not.toHaveBeenCalled();
  });

  it('rifiuta un array di moduli vuoto (stessa regola già applicata dal Preventivatore)', async () => {
    await expect(
      creaProgettoPreimpostato(TENANT, { nome: 'Test', categoria: 'ARMADIO', moduli: [] }),
    ).rejects.toThrow('Aggiungi almeno un modulo.');
  });

  it('crea con successo un progetto con moduli validi e calcola ordinamento se assente', async () => {
    findMany.mockResolvedValueOnce([{ ordinamento: 2 }, { ordinamento: 0 }]);
    create.mockResolvedValueOnce({ id: 'p1' });

    await creaProgettoPreimpostato(TENANT, {
      nome: 'Cabina armadio', categoria: 'ARMADIO', moduli: [MODULO_VALIDO as never],
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ tenantId: TENANT, nome: 'Cabina armadio', ordinamento: 3 }),
    }));
  });
});

describe('aggiornaProgettoPreimpostato / eliminaProgettoPreimpostato — isolamento tenant', () => {
  it('rifiuta l\'aggiornamento se il progetto appartiene a un altro tenant', async () => {
    findUnique.mockResolvedValueOnce({ id: 'p1', tenantId: 'tenant-2', nome: 'X', categoria: 'Y', moduli: [MODULO_VALIDO] });
    await expect(aggiornaProgettoPreimpostato(TENANT, 'p1', { nome: 'Nuovo nome' })).rejects.toThrow('Progetto preimpostato non trovato.');
    expect(update).not.toHaveBeenCalled();
  });

  it('rifiuta l\'eliminazione se il progetto appartiene a un altro tenant', async () => {
    findUnique.mockResolvedValueOnce({ id: 'p1', tenantId: 'tenant-2' });
    await expect(eliminaProgettoPreimpostato(TENANT, 'p1')).rejects.toThrow('Progetto preimpostato non trovato.');
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it('rifiuta impostaPubblicazione se il progetto appartiene a un altro tenant', async () => {
    findUnique.mockResolvedValueOnce({ id: 'p1', tenantId: 'tenant-2' });
    await expect(impostaPubblicazioneProgettoPreimpostato(TENANT, 'p1', true)).rejects.toThrow('Progetto preimpostato non trovato.');
    expect(update).not.toHaveBeenCalled();
  });

  it('aggiorna correttamente quando il tenant corrisponde', async () => {
    findUnique.mockResolvedValueOnce({ id: 'p1', tenantId: TENANT, nome: 'X', categoria: 'ARMADIO', moduli: [MODULO_VALIDO] });
    update.mockResolvedValueOnce({ id: 'p1' });
    await aggiornaProgettoPreimpostato(TENANT, 'p1', { nome: 'Nuovo nome' });
    expect(update).toHaveBeenCalledWith({ where: { id: 'p1' }, data: { nome: 'Nuovo nome' } });
  });
});

describe('recuperaProgettoPreimpostatoPubblicato — uso pubblico', () => {
  it('è tenant-scoped e richiede pubblicata=true nella query', async () => {
    findFirst.mockResolvedValueOnce(null);
    const risultato = await recuperaProgettoPreimpostatoPubblicato(TENANT, 'p1');
    expect(risultato).toBeNull();
    expect(findFirst).toHaveBeenCalledWith({ where: { id: 'p1', tenantId: TENANT, pubblicata: true } });
  });

  it('restituisce i moduli quando il progetto è pubblicato e valido', async () => {
    findFirst.mockResolvedValueOnce({
      id: 'p1', nome: 'Cabina armadio', categoria: 'ARMADIO', descrizione: null, immagine: null,
      moduli: [MODULO_VALIDO], pubblicata: true, tenantId: TENANT,
    });
    const risultato = await recuperaProgettoPreimpostatoPubblicato(TENANT, 'p1');
    expect(risultato?.moduli).toEqual([MODULO_VALIDO]);
  });

  it('torna null (non lancia) se i moduli salvati non sono più validi', async () => {
    findFirst.mockResolvedValueOnce({
      id: 'p1', nome: 'Vecchio progetto', categoria: 'ARMADIO', descrizione: null, immagine: null,
      moduli: [MODULO_FUORI_LIMITI], pubblicata: true, tenantId: TENANT,
    });
    await expect(recuperaProgettoPreimpostatoPubblicato(TENANT, 'p1')).resolves.toBeNull();
  });
});

describe('elencoProgettiPreimpostati', () => {
  it('interroga per tenant, ordinato', async () => {
    findMany.mockResolvedValueOnce([]);
    await elencoProgettiPreimpostati(TENANT);
    expect(findMany).toHaveBeenCalledWith({ where: { tenantId: TENANT }, orderBy: { ordinamento: 'asc' } });
  });
});
