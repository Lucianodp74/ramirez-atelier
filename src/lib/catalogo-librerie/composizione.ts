import {
  CATALOGO_MODULI,
  validaModulo,
  type ConfigurazioneModulo,
  type Finitura,
  type Materiale,
  type ModuloConfigurato,
  type ModuloTipo,
} from '@/lib/preventivatore/moduli';

/**
 * CATALOGO LIBRERIE - struttura di composizione di una libreria.
 *
 * Descrive una libreria come sequenza di colonne (moduli verticali), ognuna
 * fatta di vani impilati dal basso verso l'alto. È la base della futura
 * composizione modulare: oggi serve a tre cose, tutte derivate dallo stesso
 * dato e mai scritte a mano due volte:
 *   1. le dimensioni e le caratteristiche mostrate nella scheda prodotto;
 *   2. il disegno schematico (nessuna fotografia finta);
 *   3. i `ModuloConfigurato[]` passati al Preventivatore esistente.
 *
 * Nessuna formula di produzione e nessun prezzo: limiti dimensionali,
 * materiali e finiture ammessi sono quelli di `CATALOGO_MODULI`, non regole
 * nuove. Le compatibilità tecniche non ancora approvate (fianchi condivisi,
 * portata dei ripiani, giunzioni tra colonne) restano deliberatamente fuori:
 * v. docs/catalogo-librerie.md.
 */
export type TipoVano = 'VANO_APERTO' | 'BASE_ANTE' | 'CASSETTI';

export interface VanoComposizione {
  tipo: TipoVano;
  altezzaCm: number;
  /** Ripiani interni (solo VANO_APERTO e BASE_ANTE). */
  ripiani?: number;
  /** Numero di ante (solo BASE_ANTE). */
  ante?: 1 | 2;
  /** Numero di cassetti (solo CASSETTI). */
  cassetti?: 3 | 4;
}

export interface ColonnaComposizione {
  id: string;
  larghezzaCm: number;
  /** Dal basso verso l'alto. */
  vani: VanoComposizione[];
}

export interface ComposizioneLibreria {
  profonditaCm: number;
  schienale: boolean;
  materiale: Materiale;
  finitura: Finitura;
  /** Da sinistra a destra. */
  colonne: ColonnaComposizione[];
}

const TIPO_MODULO_PER_VANO: Record<TipoVano, ModuloTipo> = {
  VANO_APERTO: 'LIBRERIA',
  BASE_ANTE: 'BASE',
  CASSETTI: 'CASSETTIERA',
};

function configurazionePerVano(vano: VanoComposizione): ConfigurazioneModulo {
  if (vano.tipo === 'VANO_APERTO') return 'APERTO';
  if (vano.tipo === 'BASE_ANTE') return vano.ante === 1 ? '1_PORTA' : '2_PORTE';
  return vano.cassetti === 4 ? '4_CASSETTI' : '3_CASSETTI';
}

export function altezzaColonna(colonna: ColonnaComposizione): number {
  return colonna.vani.reduce((somma, vano) => somma + vano.altezzaCm, 0);
}

/** Ingombro complessivo: larghezze sommate, altezza della colonna più alta. */
export function ingombroComposizione(composizione: ComposizioneLibreria) {
  return {
    larghezzaCm: composizione.colonne.reduce((somma, colonna) => somma + colonna.larghezzaCm, 0),
    altezzaCm: Math.max(0, ...composizione.colonne.map(altezzaColonna)),
    profonditaCm: composizione.profonditaCm,
  };
}

/**
 * Traduce la composizione nei moduli del Preventivatore: un modulo per vano,
 * copiato per valore (stesso principio dei Progetti Preimpostati). L'id di
 * ogni modulo porta il `prefissoId` (il codice del modello), così la
 * configurazione salvata con la richiesta conserva la traccia del modello
 * di catalogo da cui è partita, senza nuovi campi né nuove tabelle.
 */
export function moduliPreventivatoreDa(
  prefissoId: string,
  composizione: ComposizioneLibreria,
): ModuloConfigurato[] {
  return composizione.colonne.flatMap((colonna) =>
    colonna.vani.map((vano, indice) => ({
      id: `${prefissoId}:${colonna.id}:${indice + 1}`,
      tipo: TIPO_MODULO_PER_VANO[vano.tipo],
      larghezzaCm: colonna.larghezzaCm,
      altezzaCm: vano.altezzaCm,
      profonditaCm: composizione.profonditaCm,
      materiale: composizione.materiale,
      finitura: composizione.finitura,
      configurazione: configurazionePerVano(vano),
      ...(vano.tipo === 'CASSETTI' ? {} : { ripiani: vano.ripiani ?? 0 }),
    })),
  );
}

/**
 * Validazione strutturale. I limiti dimensionali e le combinazioni ammesse
 * sono quelli già applicati dal Preventivatore (`validaModulo`): qui si
 * aggiunge solo la coerenza della struttura, nessuna regola tecnica nuova.
 */
export function validaComposizione(composizione: ComposizioneLibreria): string[] {
  const errori: string[] = [];
  if (composizione.colonne.length === 0) return ['La composizione non ha colonne.'];

  const idColonne = new Set<string>();
  for (const colonna of composizione.colonne) {
    if (!colonna.id || idColonne.has(colonna.id)) {
      errori.push(`Identificativo colonna mancante o duplicato: "${colonna.id}".`);
    }
    idColonne.add(colonna.id);
    if (colonna.vani.length === 0) errori.push(`La colonna ${colonna.id} non ha vani.`);
    for (const vano of colonna.vani) {
      if (vano.tipo !== 'BASE_ANTE' && vano.ante !== undefined) {
        errori.push(`Colonna ${colonna.id}: le ante sono previste solo per le basi.`);
      }
      if (vano.tipo !== 'CASSETTI' && vano.cassetti !== undefined) {
        errori.push(`Colonna ${colonna.id}: i cassetti sono previsti solo per le cassettiere.`);
      }
      if (vano.tipo === 'CASSETTI' && vano.ripiani !== undefined) {
        errori.push(`Colonna ${colonna.id}: una cassettiera non ha ripiani.`);
      }
    }
  }

  moduliPreventivatoreDa('validazione', composizione).forEach((modulo) => {
    for (const errore of validaModulo(modulo)) errori.push(`${modulo.id}: ${errore}`);
  });
  return errori;
}

export interface RiepilogoElementi {
  colonne: number;
  vaniAperti: number;
  ripiani: number;
  basiConAnte: number;
  ante: number;
  cassettiere: number;
  cassetti: number;
  schienale: boolean;
}

/** Conteggio degli elementi, derivato dalla struttura: alimenta la scheda tecnica. */
export function riepilogoElementi(composizione: ComposizioneLibreria): RiepilogoElementi {
  const vani = composizione.colonne.flatMap((colonna) => colonna.vani);
  const conta = (tipo: TipoVano) => vani.filter((vano) => vano.tipo === tipo);
  return {
    colonne: composizione.colonne.length,
    vaniAperti: conta('VANO_APERTO').length,
    ripiani: vani.reduce((somma, vano) => somma + (vano.ripiani ?? 0), 0),
    basiConAnte: conta('BASE_ANTE').length,
    ante: conta('BASE_ANTE').reduce((somma, vano) => somma + (vano.ante ?? 2), 0),
    cassettiere: conta('CASSETTI').length,
    cassetti: conta('CASSETTI').reduce((somma, vano) => somma + (vano.cassetti ?? 3), 0),
    schienale: composizione.schienale,
  };
}

/**
 * Materiali e finiture realmente selezionabili per questa composizione nel
 * Preventivatore: l'intersezione di quanto `CATALOGO_MODULI` ammette per i
 * tipi di modulo usati. Mai un elenco scritto a mano.
 */
export function opzioniDisponibili(composizione: ComposizioneLibreria): {
  materiali: Materiale[];
  finiture: Finitura[];
} {
  const tipi = new Set(
    composizione.colonne.flatMap((colonna) =>
      colonna.vani.map((vano) => TIPO_MODULO_PER_VANO[vano.tipo]),
    ),
  );
  const cataloghi = CATALOGO_MODULI.filter((modulo) => tipi.has(modulo.codice));
  if (cataloghi.length === 0) return { materiali: [], finiture: [] };
  return {
    materiali: cataloghi[0].materiali.filter((m) =>
      cataloghi.every((c) => c.materiali.includes(m)),
    ),
    finiture: cataloghi[0].finiture.filter((f) => cataloghi.every((c) => c.finiture.includes(f))),
  };
}
