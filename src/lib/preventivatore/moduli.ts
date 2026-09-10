export type ModuloTipo = 'BASE' | 'PENSILE' | 'COLONNA' | 'CASSETTIERA' | 'LIBRERIA';
export type Materiale = 'TRUCIOLARE' | 'MDF' | 'MULTISTRATO';
export type Finitura = 'MELAMINICO' | 'LAMINATO' | 'LACCATO';
export type ConfigurazioneModulo = 'APERTO' | '1_PORTA' | '2_PORTE' | '3_CASSETTI' | '4_CASSETTI' | 'PORTE_CASSETTI';

export type ModuloCatalogo = {
  codice: ModuloTipo;
  nome: string;
  min: { larghezzaCm: number; altezzaCm: number; profonditaCm: number };
  max: { larghezzaCm: number; altezzaCm: number; profonditaCm: number };
  materiali: Materiale[];
  finiture: Finitura[];
  configurazioni: ConfigurazioneModulo[];
};

export const CATALOGO_MODULI: readonly ModuloCatalogo[] = [
  { codice: 'BASE', nome: 'Base', min: { larghezzaCm: 30, altezzaCm: 60, profonditaCm: 30 }, max: { larghezzaCm: 180, altezzaCm: 120, profonditaCm: 70 }, materiali: ['TRUCIOLARE','MDF','MULTISTRATO'], finiture: ['MELAMINICO','LAMINATO','LACCATO'], configurazioni: ['APERTO','1_PORTA','2_PORTE','3_CASSETTI','4_CASSETTI','PORTE_CASSETTI'] },
  { codice: 'PENSILE', nome: 'Pensile', min: { larghezzaCm: 30, altezzaCm: 30, profonditaCm: 20 }, max: { larghezzaCm: 180, altezzaCm: 120, profonditaCm: 45 }, materiali: ['TRUCIOLARE','MDF','MULTISTRATO'], finiture: ['MELAMINICO','LAMINATO','LACCATO'], configurazioni: ['APERTO','1_PORTA','2_PORTE'] },
  { codice: 'COLONNA', nome: 'Colonna', min: { larghezzaCm: 30, altezzaCm: 120, profonditaCm: 30 }, max: { larghezzaCm: 120, altezzaCm: 280, profonditaCm: 70 }, materiali: ['TRUCIOLARE','MDF','MULTISTRATO'], finiture: ['MELAMINICO','LAMINATO','LACCATO'], configurazioni: ['APERTO','1_PORTA','2_PORTE','PORTE_CASSETTI'] },
  { codice: 'CASSETTIERA', nome: 'Cassettiera', min: { larghezzaCm: 30, altezzaCm: 30, profonditaCm: 30 }, max: { larghezzaCm: 140, altezzaCm: 140, profonditaCm: 70 }, materiali: ['TRUCIOLARE','MDF','MULTISTRATO'], finiture: ['MELAMINICO','LAMINATO','LACCATO'], configurazioni: ['3_CASSETTI','4_CASSETTI'] },
  { codice: 'LIBRERIA', nome: 'Libreria / contenitore', min: { larghezzaCm: 40, altezzaCm: 60, profonditaCm: 20 }, max: { larghezzaCm: 300, altezzaCm: 280, profonditaCm: 60 }, materiali: ['TRUCIOLARE','MDF','MULTISTRATO'], finiture: ['MELAMINICO','LAMINATO','LACCATO'], configurazioni: ['APERTO','1_PORTA','2_PORTE'] },
];

export type ModuloConfigurato = {
  id: string;
  tipo: ModuloTipo;
  larghezzaCm: number;
  altezzaCm: number;
  profonditaCm: number;
  materiale: Materiale;
  finitura: Finitura;
  configurazione: ConfigurazioneModulo;
  ripiani?: number;
};

export function validaModulo(m: ModuloConfigurato): string[] {
  const catalogo = CATALOGO_MODULI.find(x => x.codice === m.tipo);
  if (!catalogo) return ['Tipo modulo non supportato.'];
  const errors: string[] = [];
  const dims: Array<[string, number, number, number]> = [
    ['larghezza', m.larghezzaCm, catalogo.min.larghezzaCm, catalogo.max.larghezzaCm],
    ['altezza', m.altezzaCm, catalogo.min.altezzaCm, catalogo.max.altezzaCm],
    ['profondita', m.profonditaCm, catalogo.min.profonditaCm, catalogo.max.profonditaCm],
  ];
  for (const [nome, value, min, max] of dims) if (!Number.isFinite(value) || value < min || value > max) errors.push(`${nome} fuori limite (${min}-${max} cm).`);
  if (!catalogo.materiali.includes(m.materiale)) errors.push('Materiale non disponibile per il modulo.');
  if (!catalogo.finiture.includes(m.finitura)) errors.push('Finitura non disponibile per il modulo.');
  if (!catalogo.configurazioni.includes(m.configurazione)) errors.push('Configurazione non disponibile per il modulo.');
  if (m.ripiani !== undefined && (!Number.isInteger(m.ripiani) || m.ripiani < 0 || m.ripiani > 20)) errors.push('Numero ripiani non valido.');
  return errors;
}
