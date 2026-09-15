export type UnitaTariffa = 'M2' | 'ML' | 'PZ' | 'H' | 'H/M2' | 'H/PZ' | 'EUR/H' | '%';
export type TipoTariffa = 'MATERIALE' | 'COMPONENTE';

export type DefinizioneTariffaPreventivatore = { codice: string; nome: string; tipo: TipoTariffa; unita: UnitaTariffa };

export const DEFINIZIONI_TARIFFE_PREVENTIVATORE = [
  { codice: 'MAT-TRUCIOLARE', nome: 'Truciolare', tipo: 'MATERIALE', unita: 'M2' }, { codice: 'MAT-MDF', nome: 'MDF', tipo: 'MATERIALE', unita: 'M2' }, { codice: 'MAT-MULTISTRATO', nome: 'Multistrato', tipo: 'MATERIALE', unita: 'M2' },
  { codice: 'FIN-MELAMINICO', nome: 'Melaminico', tipo: 'COMPONENTE', unita: 'M2' }, { codice: 'FIN-LAMINATO', nome: 'Laminato', tipo: 'COMPONENTE', unita: 'M2' }, { codice: 'FIN-LACCATO', nome: 'Laccato', tipo: 'COMPONENTE', unita: 'M2' },
  { codice: 'SERV-BORDO-ML', nome: 'Bordatura', tipo: 'COMPONENTE', unita: 'ML' }, { codice: 'MAT-RETRO-M2', nome: 'Retro', tipo: 'MATERIALE', unita: 'M2' }, { codice: 'FER-PORTA', nome: 'Ferramenta porta', tipo: 'COMPONENTE', unita: 'PZ' }, { codice: 'FER-CASSETTO', nome: 'Ferramenta cassetto', tipo: 'COMPONENTE', unita: 'PZ' },
  { codice: 'MAN-ORE-BASE', nome: 'Ore base', tipo: 'COMPONENTE', unita: 'H' }, { codice: 'MAN-ORE-M2', nome: 'Ore per m²', tipo: 'COMPONENTE', unita: 'H/M2' }, { codice: 'MAN-ORE-PORTA', nome: 'Ore per porta', tipo: 'COMPONENTE', unita: 'H/PZ' }, { codice: 'MAN-ORE-CASSETTO', nome: 'Ore per cassetto', tipo: 'COMPONENTE', unita: 'H/PZ' }, { codice: 'MAN-ORE-RIPIANO', nome: 'Ore per ripiano', tipo: 'COMPONENTE', unita: 'H/PZ' }, { codice: 'MAN-COSTO-ORA', nome: 'Costo orario', tipo: 'COMPONENTE', unita: 'EUR/H' }, { codice: 'COMM-RICARICO', nome: 'Ricarico commerciale', tipo: 'COMPONENTE', unita: '%' },
] as const satisfies readonly DefinizioneTariffaPreventivatore[];

export const CODICI_TARIFFE_PREVENTIVATORE = {
  materiali: { TRUCIOLARE: 'MAT-TRUCIOLARE', MDF: 'MAT-MDF', MULTISTRATO: 'MAT-MULTISTRATO' },
  finiture: { MELAMINICO: 'FIN-MELAMINICO', LAMINATO: 'FIN-LAMINATO', LACCATO: 'FIN-LACCATO' },
  bordo: 'SERV-BORDO-ML', retro: 'MAT-RETRO-M2', ferramentaPorta: 'FER-PORTA', ferramentaCassetto: 'FER-CASSETTO', oreBase: 'MAN-ORE-BASE', orePerM2: 'MAN-ORE-M2', orePerPorta: 'MAN-ORE-PORTA', orePerCassetto: 'MAN-ORE-CASSETTO', orePerRipiano: 'MAN-ORE-RIPIANO', costoOra: 'MAN-COSTO-ORA', ricarico: 'COMM-RICARICO',
} as const;
