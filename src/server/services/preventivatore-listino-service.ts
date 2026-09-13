import { Prisma } from '@prisma/client';
import { db } from '@/server/db';
import { DEFINIZIONI_TARIFFE_PREVENTIVATORE } from '@/lib/preventivatore/tariffe';
import type { Finitura, Materiale } from '@/lib/preventivatore/moduli';
import type { TariffePreventivatore } from '@/lib/preventivatore/prezzo-modulare';

export const CODICI_TARIFFE_PREVENTIVATORE = {
  materiali: { TRUCIOLARE: 'MAT-TRUCIOLARE', MDF: 'MAT-MDF', MULTISTRATO: 'MAT-MULTISTRATO' },
  finiture: { MELAMINICO: 'FIN-MELAMINICO', LAMINATO: 'FIN-LAMINATO', LACCATO: 'FIN-LACCATO' },
  bordo: 'SERV-BORDO-ML', retro: 'MAT-RETRO-M2', ferramentaPorta: 'FER-PORTA', ferramentaCassetto: 'FER-CASSETTO',
  oreBase: 'MAN-ORE-BASE', orePerM2: 'MAN-ORE-M2', orePerPorta: 'MAN-ORE-PORTA', orePerCassetto: 'MAN-ORE-CASSETTO', orePerRipiano: 'MAN-ORE-RIPIANO', costoOra: 'MAN-COSTO-ORA', ricarico: 'COMM-RICARICO',
} as const;

type VoceTariffa = { codice: string; prezzo: number; unita: string; attivo: boolean };

function numeroPositivo(voce: VoceTariffa, atteso: string): number {
  if (!voce.attivo || !Number.isFinite(voce.prezzo) || voce.prezzo < 0) throw new Error(`Tariffa ${voce.codice} non valida nel Listino.`);
  if (voce.unita !== atteso) throw new Error(`Tariffa ${voce.codice}: unità attesa ${atteso}, trovata ${voce.unita}.`);
  return voce.prezzo;
}

export function costruisciTariffeDaListino(voci: VoceTariffa[]): TariffePreventivatore {
  const perCodice = new Map<string, VoceTariffa>();
  for (const voce of voci) {
    if (perCodice.has(voce.codice)) throw new Error(`Codice Listino duplicato per il Preventivatore: ${voce.codice}.`);
    perCodice.set(voce.codice, voce);
  }
  const trova = (codice: string) => { const voce = perCodice.get(codice); if (!voce) throw new Error(`Manca nel Listino la tariffa ${codice}.`); return voce; };
  const c = CODICI_TARIFFE_PREVENTIVATORE;
  return {
    materialeEuroM2: { TRUCIOLARE: numeroPositivo(trova(c.materiali.TRUCIOLARE), 'M2'), MDF: numeroPositivo(trova(c.materiali.MDF), 'M2'), MULTISTRATO: numeroPositivo(trova(c.materiali.MULTISTRATO), 'M2') } satisfies Record<Materiale, number>,
    finituraEuroM2: { MELAMINICO: numeroPositivo(trova(c.finiture.MELAMINICO), 'M2'), LAMINATO: numeroPositivo(trova(c.finiture.LAMINATO), 'M2'), LACCATO: numeroPositivo(trova(c.finiture.LACCATO), 'M2') } satisfies Record<Finitura, number>,
    bordoEuroMl: numeroPositivo(trova(c.bordo), 'ML'), retroEuroM2: numeroPositivo(trova(c.retro), 'M2'), ferramentaPerPorta: numeroPositivo(trova(c.ferramentaPorta), 'PZ'), ferramentaPerCassetto: numeroPositivo(trova(c.ferramentaCassetto), 'PZ'),
    oreBase: numeroPositivo(trova(c.oreBase), 'H'), orePerM2: numeroPositivo(trova(c.orePerM2), 'H/M2'), orePerPorta: numeroPositivo(trova(c.orePerPorta), 'H/PZ'), orePerCassetto: numeroPositivo(trova(c.orePerCassetto), 'H/PZ'), orePerRipiano: numeroPositivo(trova(c.orePerRipiano), 'H/PZ'), costoOra: numeroPositivo(trova(c.costoOra), 'EUR/H'), ricaricoPercentuale: numeroPositivo(trova(c.ricarico), '%'),
  };
}

export async function caricaTariffePreventivatore(tenantId: string): Promise<TariffePreventivatore> {
  const codici = DEFINIZIONI_TARIFFE_PREVENTIVATORE.map((voce) => voce.codice);
  const voci = await db.$queryRaw<VoceTariffa[]>`
    SELECT "codice", "prezzo"::float8 AS "prezzo", "unita", "attivo" FROM "listino_prezzo"
    WHERE "tenantId" = ${tenantId} AND "attivo" = true
      AND "codice" IN (${Prisma.join(codici.map((codice) => Prisma.sql`${codice}`), ',')})
  `;
  return costruisciTariffeDaListino(voci);
}
