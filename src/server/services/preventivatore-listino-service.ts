import { Prisma } from '@prisma/client';
import { db } from '@/server/db';
import type { Finitura, Materiale } from '@/lib/preventivatore/moduli';
import type { TariffePreventivatore } from '@/lib/preventivatore/prezzo-modulare';

/**
 * Codici tecnici che il pannello Listino deve contenere per alimentare il
 * Preventivatore. I prezzi restano esclusivamente nel database: qui definiamo
 * solo il contratto stabile tra catalogo amministrativo e motore.
 */
export const CODICI_TARIFFE_PREVENTIVATORE = {
  materiali: {
    TRUCIOLARE: 'MAT-TRUCIOLARE',
    MDF: 'MAT-MDF',
    MULTISTRATO: 'MAT-MULTISTRATO',
  },
  finiture: {
    MELAMINICO: 'FIN-MELAMINICO',
    LAMINATO: 'FIN-LAMINATO',
    LACCATO: 'FIN-LACCATO',
  },
  bordo: 'SERV-BORDO-ML',
  retro: 'MAT-RETRO-M2',
  ferramentaPorta: 'FER-PORTA',
  ferramentaCassetto: 'FER-CASSETTO',
  oreBase: 'MAN-ORE-BASE',
  orePerM2: 'MAN-ORE-M2',
  orePerPorta: 'MAN-ORE-PORTA',
  orePerCassetto: 'MAN-ORE-CASSETTO',
  orePerRipiano: 'MAN-ORE-RIPIANO',
  costoOra: 'MAN-COSTO-ORA',
  ricarico: 'COMM-RICARICO',
} as const;

type VoceTariffa = { codice: string; prezzo: number; unita: string; attivo: boolean };

function numeroPositivo(voce: VoceTariffa, atteso: string): number {
  if (!voce.attivo || !Number.isFinite(voce.prezzo) || voce.prezzo < 0) {
    throw new Error(`Tariffa ${voce.codice} non valida nel Listino.`);
  }
  if (voce.unita !== atteso) {
    throw new Error(`Tariffa ${voce.codice}: unità attesa ${atteso}, trovata ${voce.unita}.`);
  }
  return voce.prezzo;
}

export function costruisciTariffeDaListino(voci: VoceTariffa[]): TariffePreventivatore {
  const perCodice = new Map(voci.map((voce) => [voce.codice, voce]));
  const trova = (codice: string): VoceTariffa => {
    const voce = perCodice.get(codice);
    if (!voce) throw new Error(`Manca nel Listino la tariffa ${codice}.`);
    return voce;
  };

  const materiali = CODICI_TARIFFE_PREVENTIVATORE.materiali;
  const finiture = CODICI_TARIFFE_PREVENTIVATORE.finiture;

  return {
    materialeEuroM2: {
      TRUCIOLARE: numeroPositivo(trova(materiali.TRUCIOLARE), 'M2'),
      MDF: numeroPositivo(trova(materiali.MDF), 'M2'),
      MULTISTRATO: numeroPositivo(trova(materiali.MULTISTRATO), 'M2'),
    } satisfies Record<Materiale, number>,
    finituraEuroM2: {
      MELAMINICO: numeroPositivo(trova(finiture.MELAMINICO), 'M2'),
      LAMINATO: numeroPositivo(trova(finiture.LAMINATO), 'M2'),
      LACCATO: numeroPositivo(trova(finiture.LACCATO), 'M2'),
    } satisfies Record<Finitura, number>,
    bordoEuroMl: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.bordo), 'ML'),
    retroEuroM2: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.retro), 'M2'),
    ferramentaPerPorta: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.ferramentaPorta), 'PZ'),
    ferramentaPerCassetto: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.ferramentaCassetto), 'PZ'),
    oreBase: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.oreBase), 'H'),
    orePerM2: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.orePerM2), 'H/M2'),
    orePerPorta: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.orePerPorta), 'H/PZ'),
    orePerCassetto: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.orePerCassetto), 'H/PZ'),
    orePerRipiano: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.orePerRipiano), 'H/PZ'),
    costoOra: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.costoOra), 'EUR/H'),
    ricaricoPercentuale: numeroPositivo(trova(CODICI_TARIFFE_PREVENTIVATORE.ricarico), '%'),
  };
}

/** Carica dal Listino solo le voci tecniche richieste dal Preventivatore. */
export async function caricaTariffePreventivatore(tenantId: string): Promise<TariffePreventivatore> {
  const codici = [
    ...Object.values(CODICI_TARIFFE_PREVENTIVATORE.materiali),
    ...Object.values(CODICI_TARIFFE_PREVENTIVATORE.finiture),
    CODICI_TARIFFE_PREVENTIVATORE.bordo,
    CODICI_TARIFFE_PREVENTIVATORE.retro,
    CODICI_TARIFFE_PREVENTIVATORE.ferramentaPorta,
    CODICI_TARIFFE_PREVENTIVATORE.ferramentaCassetto,
    CODICI_TARIFFE_PREVENTIVATORE.oreBase,
    CODICI_TARIFFE_PREVENTIVATORE.orePerM2,
    CODICI_TARIFFE_PREVENTIVATORE.orePerPorta,
    CODICI_TARIFFE_PREVENTIVATORE.orePerCassetto,
    CODICI_TARIFFE_PREVENTIVATORE.orePerRipiano,
    CODICI_TARIFFE_PREVENTIVATORE.costoOra,
    CODICI_TARIFFE_PREVENTIVATORE.ricarico,
  ] as string[];

  const voci = await db.$queryRaw<VoceTariffa[]>`
    SELECT "codice", "prezzo"::float8 AS "prezzo", "unita", "attivo"
    FROM "listino_prezzo"
    WHERE "tenantId" = ${tenantId}
      AND "attivo" = true
      AND "codice" IN (${Prisma.join(codici.map((codice) => Prisma.sql`${codice}`), ',')})
  `;

  return costruisciTariffeDaListino(voci);
}
