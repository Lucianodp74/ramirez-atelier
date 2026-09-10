import type { ConfigurazioneModulo, Finitura, Materiale, ModuloConfigurato } from './moduli';
import { validaModulo } from './moduli';

export type TariffePreventivatore = {
  materialeEuroM2: Record<Materiale, number>;
  finituraEuroM2: Record<Finitura, number>;
  bordoEuroMl: number;
  retroEuroM2: number;
  ferramentaPerPorta: number;
  ferramentaPerCassetto: number;
  oreBase: number;
  orePerM2: number;
  orePerPorta: number;
  orePerCassetto: number;
  orePerRipiano: number;
  costoOra: number;
  ricaricoPercentuale: number;
};

/** Valori dimostrativi: servono ai test e alla struttura del motore, non sono prezzi Ramirez. */
export const TARIFFE_DEMO: TariffePreventivatore = {
  materialeEuroM2: { TRUCIOLARE: 30, MDF: 38, MULTISTRATO: 55 },
  finituraEuroM2: { MELAMINICO: 0, LAMINATO: 18, LACCATO: 45 },
  bordoEuroMl: 2.5,
  retroEuroM2: 12,
  ferramentaPerPorta: 18,
  ferramentaPerCassetto: 28,
  oreBase: 0.8,
  orePerM2: 0.9,
  orePerPorta: 0.35,
  orePerCassetto: 0.5,
  orePerRipiano: 0.12,
  costoOra: 38,
  ricaricoPercentuale: 35,
};

export type RigaCostoModulo = {
  id: string;
  tipo: ModuloConfigurato['tipo'];
  superficieM2: number;
  materiale: number;
  finitura: number;
  bordo: number;
  retro: number;
  ferramenta: number;
  manodopera: number;
  costoProduzione: number;
  prezzoIndicativo: number;
};

export type PreventivoModulare = {
  righe: RigaCostoModulo[];
  costoProduzione: number;
  prezzoIndicativo: number;
  errori: string[];
};

const euro = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const m2 = (cm2: number) => cm2 / 10000;

function quantitaConfigurazione(config: ConfigurazioneModulo) {
  return {
    porte: config === '1_PORTA' ? 1 : config === '2_PORTE' || config === 'PORTE_CASSETTI' ? 2 : 0,
    cassetti: config === '3_CASSETTI' ? 3 : config === '4_CASSETTI' ? 4 : config === 'PORTE_CASSETTI' ? 2 : 0,
  };
}

export function calcolaCostoModulo(modulo: ModuloConfigurato, tariffe: TariffePreventivatore = TARIFFE_DEMO): RigaCostoModulo {
  const errori = validaModulo(modulo);
  if (errori.length) throw new Error(errori.join(' '));
  const superficie = m2(2 * (modulo.larghezzaCm * modulo.profonditaCm) + 2 * (modulo.altezzaCm * modulo.profonditaCm) + modulo.larghezzaCm * modulo.altezzaCm);
  const retro = m2(modulo.larghezzaCm * modulo.altezzaCm);
  const bordoMl = (2 * modulo.larghezzaCm + 2 * modulo.altezzaCm) / 100;
  const { porte, cassetti } = quantitaConfigurazione(modulo.configurazione);
  const ripiani = modulo.ripiani ?? (modulo.configurazione === 'APERTO' ? 2 : 1);
  const materiale = superficie * tariffe.materialeEuroM2[modulo.materiale];
  const finitura = superficie * tariffe.finituraEuroM2[modulo.finitura];
  const costoBordo = bordoMl * tariffe.bordoEuroMl;
  const costoRetro = retro * tariffe.retroEuroM2;
  const ferramenta = porte * tariffe.ferramentaPerPorta + cassetti * tariffe.ferramentaPerCassetto;
  const ore = tariffe.oreBase + superficie * tariffe.orePerM2 + porte * tariffe.orePerPorta + cassetti * tariffe.orePerCassetto + ripiani * tariffe.orePerRipiano;
  const manodopera = ore * tariffe.costoOra;
  const costoProduzione = euro(materiale + finitura + costoBordo + costoRetro + ferramenta + manodopera);
  return { id: modulo.id, tipo: modulo.tipo, superficieM2: euro(superficie), materiale: euro(materiale), finitura: euro(finitura), bordo: euro(costoBordo), retro: euro(costoRetro), ferramenta: euro(ferramenta), manodopera: euro(manodopera), costoProduzione, prezzoIndicativo: euro(costoProduzione * (1 + tariffe.ricaricoPercentuale / 100)) };
}

export function calcolaPreventivoModulare(moduli: ModuloConfigurato[], tariffe: TariffePreventivatore = TARIFFE_DEMO): PreventivoModulare {
  const errori: string[] = [];
  const righe: RigaCostoModulo[] = [];
  for (const modulo of moduli) {
    try { righe.push(calcolaCostoModulo(modulo, tariffe)); }
    catch (error) { errori.push(`${modulo.id}: ${error instanceof Error ? error.message : 'modulo non valido'}`); }
  }
  const costoProduzione = euro(righe.reduce((s, r) => s + r.costoProduzione, 0));
  return { righe, costoProduzione, prezzoIndicativo: euro(costoProduzione * (1 + tariffe.ricaricoPercentuale / 100)), errori };
}
