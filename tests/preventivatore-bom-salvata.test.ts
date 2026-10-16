import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TariffePreventivatore } from '@/lib/preventivatore/prezzo-modulare';

/** Tariffe del Listino Ramirez come impostate dalle migrazioni (v. tests/bom-iniziale.test.ts). */
const LISTINO: TariffePreventivatore = {
  materialeEuroM2: { TRUCIOLARE: 18, MDF: 28, MULTISTRATO: 45 },
  finituraEuroM2: { MELAMINICO: 4, LAMINATO: 25, LACCATO: 45 },
  bordoEuroMl: 2.5,
  retroEuroM2: 12,
  ferramentaPerPorta: 19.5,
  ferramentaPerScorrevole: 700,
  ferramentaPerCassetto: 28,
  oreBase: 0.8,
  orePerM2: 0.9,
  orePerPorta: 0.35,
  orePerCassetto: 0.5,
  orePerRipiano: 0.12,
  costoOra: 40,
  ricaricoPercentuale: 40,
};

const mock = vi.hoisted(() => ({
  inserimenti: [] as Array<{ sql: string; valori: unknown[] }>,
  richieste: [] as Array<Record<string, unknown>>,
}));

vi.mock('@/server/db', () => ({
  db: {
    tipoProgetto: {
      findMany: vi.fn(async () => [{ id: 'tipo-1', chiave: 'falegnameria', ordinamento: 0 }]),
    },
    $transaction: async (corpo: (tx: unknown) => unknown) =>
      corpo({
        richiestaProgetto: {
          create: async ({ data }: { data: Record<string, unknown> }) => {
            mock.richieste.push(data);
            return { id: 'richiesta-1', tokenRipresa: 'token' };
          },
        },
        eventoAttivita: { create: vi.fn() },
        $executeRaw: async (sql: TemplateStringsArray, ...valori: unknown[]) => {
          mock.inserimenti.push({ sql: sql.join('?'), valori });
          return 1;
        },
      }),
  },
}));
vi.mock('@/server/identity/tenant-corrente', () => ({
  idTenantRamirezAtelier: vi.fn(async () => 'tenant-ramirez'),
}));
vi.mock('@/server/services/preventivatore-listino-service', () => ({
  caricaTariffePreventivatore: vi.fn(async () => LISTINO),
}));

import { salvaRichiestaPreventivatore } from '@/app/preventivatore/azioni';
import { moduliPerPreventivatore } from '@/lib/catalogo-librerie/catalogo';
import { totaleBom } from '@/lib/bom-totali';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';

/** Righe BOM scritte: nell'INSERT quantità e costo unitario sono l'8° e l'11° valore. */
function righeBomSalvate() {
  return mock.inserimenti
    .filter((inserimento) => inserimento.sql.includes('INSERT INTO "bom_riga"'))
    .map(({ valori }) => ({
      codice: valori[4] as string,
      quantita: valori[7] as number,
      costoUnitario: valori[10] as number,
    }));
}
/** Totale come lo ricavano i consumatori della BOM: somma dei totali di riga arrotondati. */
const totaleSalvato = (righe: ReturnType<typeof righeBomSalvate>) => totaleBom(righe);

async function salva(moduli: ModuloConfigurato[]) {
  return salvaRichiestaPreventivatore(moduli, { nome: 'Mario Rossi', email: 'mario@example.com' });
}

describe('salvaRichiestaPreventivatore — BOM iniziale coerente con il costo', () => {
  beforeEach(() => {
    mock.inserimenti.length = 0;
    mock.richieste.length = 0;
  });

  it('LIB-ESS-01: le righe BOM salvate sommano a 790,00 €, schienale a 23,76 € per modulo', async () => {
    const risposta = await salva(
      moduliPerPreventivatore('LIB-ESS-01', { anteprimaInterna: true })!,
    );
    const righe = righeBomSalvate();
    const stima = (mock.richieste[0].datiEstensione as Record<string, Record<string, unknown>>)
      .preventivatoreModulare.stima as Record<string, number>;

    expect(totaleSalvato(righe)).toBe(790);
    expect(stima.costoProduzione).toBe(790);
    expect(righe.filter((r) => r.codice === 'SCHIENALE')).toEqual([
      { codice: 'SCHIENALE', quantita: 1, costoUnitario: 23.76 },
      { codice: 'SCHIENALE', quantita: 1, costoUnitario: 23.76 },
    ]);
    // Nessuna riga di frontali per moduli aperti, nessuna riga senza costo.
    expect(righe.some((r) => r.codice === 'ANTA' || r.codice === 'FRONTALE-CASSETTO')).toBe(false);
    expect(righe.every((r) => r.quantita > 0 && r.costoUnitario > 0)).toBe(true);
    // Al browser torna solo il prezzo indicativo.
    expect(risposta.prezzoIndicativo).toBe(1106);
    expect(JSON.stringify(risposta)).not.toMatch(/costoProduzione|prezzoFalegname/);
  });

  it('moduli con frontali e armadio scorrevole: totale salvato uguale al costo di produzione', async () => {
    const base: ModuloConfigurato = {
      id: 'b1',
      tipo: 'BASE',
      larghezzaCm: 80,
      altezzaCm: 90,
      profonditaCm: 60,
      materiale: 'TRUCIOLARE',
      finitura: 'MELAMINICO',
      configurazione: '2_PORTE',
      ripiani: 1,
    };
    const colonna: ModuloConfigurato = {
      ...base,
      id: 'c1',
      tipo: 'COLONNA',
      larghezzaCm: 100,
      altezzaCm: 240,
      configurazione: 'ANTE_SCORREVOLI',
      ripiani: 3,
    };

    await salva([base, colonna, { ...colonna, id: 'c2' }]);
    const righe = righeBomSalvate();
    const stima = (mock.richieste[0].datiEstensione as Record<string, Record<string, unknown>>)
      .preventivatoreModulare.stima as Record<string, number>;

    expect(totaleSalvato(righe)).toBe(stima.costoProduzione);
    expect(
      righe.filter((r) => r.codice === 'FER-HARDWARE' && r.costoUnitario === 700),
    ).toHaveLength(1);
    expect(righe.filter((r) => r.codice === 'ANTA')).toHaveLength(3);
  });
});
