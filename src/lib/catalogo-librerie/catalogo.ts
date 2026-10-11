import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';
import {
  moduliPreventivatoreDa,
  validaComposizione,
  type ComposizioneLibreria,
} from './composizione';

/**
 * CATALOGO LIBRERIE V1 - famiglie progettuali e modelli.
 *
 * In questa prima versione il catalogo è definito nel codice, non in una
 * tabella: aggiungere una tabella richiede una migrazione, e oggi ogni build
 * di anteprima esegue `prisma migrate deploy` (v. docs/catalogo-librerie.md,
 * "Cosa manca"). Lo stato di un modello si cambia quindi con una Pull
 * Request revisionata, che è anche la traccia di chi lo ha approvato.
 *
 * I modelli qui sotto sono ESEMPI DIMOSTRATIVI in stato BOZZA: servono a
 * verificare struttura, scheda e flusso di richiesta, non sono prodotti
 * approvati da Ramirez Atelier e non sono visibili al pubblico.
 */
export type StatoModello = 'BOZZA' | 'APPROVATO' | 'NON_DISPONIBILE';

export const ETICHETTE_STATO: Record<StatoModello, string> = {
  BOZZA: 'Bozza',
  APPROVATO: 'Approvato',
  NON_DISPONIBILE: 'Non disponibile',
};

export type CodiceFamiglia = 'ESSENZIALE' | 'GEOMETRICA' | 'ATELIER' | 'PARETE' | 'MODULARE';

export interface FamigliaLibreria {
  codice: CodiceFamiglia;
  nome: string;
  sintesi: string;
  descrizione: string;
}

export const FAMIGLIE_LIBRERIE: readonly FamigliaLibreria[] = [
  {
    codice: 'ESSENZIALE',
    nome: 'Linea Essenziale',
    sintesi: 'Libreria aperta con ripiani regolari.',
    descrizione:
      'Fianchi e ripiani a passo costante: una griglia ordinata che lascia la scena ai libri e agli oggetti.',
  },
  {
    codice: 'GEOMETRICA',
    nome: 'Linea Geometrica',
    sintesi: 'Composizione asimmetrica con vani di dimensioni differenti.',
    descrizione:
      'Vani alti e bassi si alternano in un ritmo irregolare, pensato per accogliere volumi, vasi e oggetti di misure diverse.',
  },
  {
    codice: 'ATELIER',
    nome: 'Linea Atelier',
    sintesi: 'Libreria a parete con vani aperti e contenitori chiusi.',
    descrizione:
      'Basi con ante per ciò che va riposto, vani aperti in alto per ciò che si vuole mostrare.',
  },
  {
    codice: 'PARETE',
    nome: 'Linea Parete',
    sintesi: 'Composizione sviluppata in altezza e larghezza.',
    descrizione:
      'Una parete intera attrezzata da pavimento a soffitto, progettata sulle misure della stanza.',
  },
  {
    codice: 'MODULARE',
    nome: 'Linea Modulare',
    sintesi: 'Elemento predisposto per l’assemblaggio di più moduli.',
    descrizione:
      'Un modulo verticale che può vivere da solo o affiancarsi ad altri: la base della futura composizione libera.',
  },
];

export interface ImmagineModello {
  src: string;
  alt: string;
  /** Solo le immagini APPROVATE possono essere presentate come lavori reali. */
  tipo: 'APPROVATA' | 'DIMOSTRATIVA';
}

export interface ModelloLibreria {
  /** Univoco, stabile, usato negli URL: LIB-<famiglia>-<progressivo>. */
  codice: string;
  nome: string;
  famiglia: CodiceFamiglia;
  descrizione: string;
  stato: StatoModello;
  /** true = esempio di struttura, non un prodotto definito dall'atelier. */
  dimostrativo: boolean;
  /** true = pensato per essere affiancato ad altri moduli (composizione futura). */
  componibile: boolean;
  immagini: ImmagineModello[];
  composizione: ComposizioneLibreria;
}

export const FORMATO_CODICE_MODELLO = /^LIB-[A-Z]{3}-\d{2}$/;

const colonnaAperta = (id: string, larghezzaCm: number, altezzaCm: number, ripiani: number) => ({
  id,
  larghezzaCm,
  vani: [{ tipo: 'VANO_APERTO' as const, altezzaCm, ripiani }],
});

const colonnaConBase = (
  id: string,
  larghezzaCm: number,
  altezzaBaseCm: number,
  altezzaVanoCm: number,
  ripiani: number,
) => ({
  id,
  larghezzaCm,
  vani: [
    { tipo: 'BASE_ANTE' as const, altezzaCm: altezzaBaseCm, ante: 2 as const, ripiani: 1 },
    { tipo: 'VANO_APERTO' as const, altezzaCm: altezzaVanoCm, ripiani },
  ],
});

export const MODELLI_LIBRERIE: readonly ModelloLibreria[] = [
  {
    codice: 'LIB-ESS-01',
    nome: 'Essenziale 180',
    famiglia: 'ESSENZIALE',
    descrizione: 'Due colonne aperte affiancate, con ripiani a passo regolare.',
    stato: 'BOZZA',
    dimostrativo: true,
    componibile: false,
    immagini: [],
    composizione: {
      profonditaCm: 35,
      schienale: true,
      materiale: 'TRUCIOLARE',
      finitura: 'MELAMINICO',
      colonne: [colonnaAperta('c1', 90, 220, 5), colonnaAperta('c2', 90, 220, 5)],
    },
  },
  {
    codice: 'LIB-GEO-01',
    nome: 'Geometrica 240',
    famiglia: 'GEOMETRICA',
    descrizione: 'Tre colonne di larghezza diversa, con vani sfalsati in altezza.',
    stato: 'BOZZA',
    dimostrativo: true,
    componibile: false,
    immagini: [],
    composizione: {
      profonditaCm: 35,
      schienale: true,
      materiale: 'TRUCIOLARE',
      finitura: 'MELAMINICO',
      colonne: [
        {
          id: 'c1',
          larghezzaCm: 60,
          vani: [
            { tipo: 'VANO_APERTO', altezzaCm: 120, ripiani: 2 },
            { tipo: 'VANO_APERTO', altezzaCm: 100, ripiani: 1 },
          ],
        },
        {
          id: 'c2',
          larghezzaCm: 100,
          vani: [
            { tipo: 'VANO_APERTO', altezzaCm: 60, ripiani: 0 },
            { tipo: 'VANO_APERTO', altezzaCm: 160, ripiani: 3 },
          ],
        },
        {
          id: 'c3',
          larghezzaCm: 80,
          vani: [
            { tipo: 'VANO_APERTO', altezzaCm: 140, ripiani: 3 },
            { tipo: 'VANO_APERTO', altezzaCm: 80, ripiani: 1 },
          ],
        },
      ],
    },
  },
  {
    codice: 'LIB-ATE-01',
    nome: 'Atelier 270',
    famiglia: 'ATELIER',
    descrizione: 'Tre colonne con base chiusa da ante e vano aperto superiore.',
    stato: 'BOZZA',
    dimostrativo: true,
    componibile: false,
    immagini: [],
    composizione: {
      profonditaCm: 40,
      schienale: true,
      materiale: 'TRUCIOLARE',
      finitura: 'MELAMINICO',
      colonne: [
        colonnaConBase('c1', 90, 80, 160, 3),
        colonnaConBase('c2', 90, 80, 160, 3),
        colonnaConBase('c3', 90, 80, 160, 3),
      ],
    },
  },
  {
    codice: 'LIB-PAR-01',
    nome: 'Parete 360',
    famiglia: 'PARETE',
    descrizione:
      'Quattro colonne a tutta altezza: basi chiuse ai lati, vani aperti continui al centro.',
    stato: 'BOZZA',
    dimostrativo: true,
    componibile: false,
    immagini: [],
    composizione: {
      profonditaCm: 40,
      schienale: true,
      materiale: 'TRUCIOLARE',
      finitura: 'MELAMINICO',
      colonne: [
        colonnaConBase('c1', 90, 90, 180, 4),
        colonnaAperta('c2', 90, 270, 6),
        colonnaAperta('c3', 90, 270, 6),
        colonnaConBase('c4', 90, 90, 180, 4),
      ],
    },
  },
  {
    codice: 'LIB-MOD-01',
    nome: 'Modulare 90',
    famiglia: 'MODULARE',
    descrizione: 'Un solo modulo verticale con cassettiera alla base e vano aperto.',
    stato: 'BOZZA',
    dimostrativo: true,
    componibile: true,
    immagini: [],
    composizione: {
      profonditaCm: 40,
      schienale: true,
      materiale: 'TRUCIOLARE',
      finitura: 'MELAMINICO',
      colonne: [
        {
          id: 'c1',
          larghezzaCm: 90,
          vani: [
            { tipo: 'CASSETTI', altezzaCm: 60, cassetti: 3 },
            { tipo: 'VANO_APERTO', altezzaCm: 160, ripiani: 3 },
          ],
        },
      ],
    },
  },
];

export function famigliaPerCodice(codice: CodiceFamiglia): FamigliaLibreria {
  const famiglia = FAMIGLIE_LIBRERIE.find((f) => f.codice === codice);
  if (!famiglia) throw new Error(`Famiglia librerie sconosciuta: ${codice}.`);
  return famiglia;
}

/** Un modello in BOZZA non esiste per il pubblico: né in elenco né per URL diretto. */
export function visibileAlPubblico(modello: ModelloLibreria): boolean {
  return modello.stato !== 'BOZZA';
}

/** Solo un modello APPROVATO può avviare una richiesta di preventivo. */
export function richiedibile(modello: ModelloLibreria): boolean {
  return modello.stato === 'APPROVATO';
}

export function trovaModello(
  codice: string,
  catalogo: readonly ModelloLibreria[] = MODELLI_LIBRERIE,
): ModelloLibreria | null {
  if (!FORMATO_CODICE_MODELLO.test(codice)) return null;
  return catalogo.find((modello) => modello.codice === codice) ?? null;
}

export interface OpzioniAccesso {
  /** true solo per un utente autenticato dell'area operativa (anteprima bozze). */
  anteprimaInterna?: boolean;
}

export function modelliVisibili(
  { anteprimaInterna = false }: OpzioniAccesso = {},
  catalogo: readonly ModelloLibreria[] = MODELLI_LIBRERIE,
): ModelloLibreria[] {
  return catalogo.filter((modello) => anteprimaInterna || visibileAlPubblico(modello));
}

export function trovaModelloVisibile(
  codice: string,
  opzioni: OpzioniAccesso = {},
  catalogo: readonly ModelloLibreria[] = MODELLI_LIBRERIE,
): ModelloLibreria | null {
  const modello = trovaModello(codice, catalogo);
  if (!modello) return null;
  return opzioni.anteprimaInterna || visibileAlPubblico(modello) ? modello : null;
}

/**
 * Moduli con cui aprire il Preventivatore partendo da un modello di catalogo.
 * Restituisce null (il Preventivatore si apre col comportamento di sempre)
 * se il codice non esiste, se il modello non è richiedibile o se la sua
 * composizione non supera più le regole del Preventivatore.
 */
export function moduliPerPreventivatore(
  codice: string,
  { anteprimaInterna = false }: OpzioniAccesso = {},
  catalogo: readonly ModelloLibreria[] = MODELLI_LIBRERIE,
): ModuloConfigurato[] | null {
  const modello = trovaModello(codice, catalogo);
  if (!modello) return null;
  const ammesso = richiedibile(modello) || (anteprimaInterna && modello.stato === 'BOZZA');
  if (!ammesso) return null;
  if (validaComposizione(modello.composizione).length > 0) return null;
  return moduliPreventivatoreDa(modello.codice, modello.composizione);
}

/** Controllo di coerenza dell'intero catalogo: usato dai test, mai a runtime. */
export function validaCatalogo(catalogo: readonly ModelloLibreria[] = MODELLI_LIBRERIE): string[] {
  const errori: string[] = [];
  const codici = new Set<string>();
  for (const modello of catalogo) {
    if (!FORMATO_CODICE_MODELLO.test(modello.codice)) {
      errori.push(`${modello.codice}: codice non conforme a LIB-XXX-NN.`);
    }
    if (codici.has(modello.codice)) errori.push(`${modello.codice}: codice duplicato.`);
    codici.add(modello.codice);
    if (!FAMIGLIE_LIBRERIE.some((famiglia) => famiglia.codice === modello.famiglia)) {
      errori.push(`${modello.codice}: famiglia inesistente.`);
    }
    if (modello.dimostrativo && modello.stato === 'APPROVATO') {
      errori.push(`${modello.codice}: un esempio dimostrativo non può essere approvato.`);
    }
    if (modello.dimostrativo && modello.immagini.some((i) => i.tipo === 'APPROVATA')) {
      errori.push(`${modello.codice}: un esempio dimostrativo non può avere immagini approvate.`);
    }
    for (const errore of validaComposizione(modello.composizione)) {
      errori.push(`${modello.codice}: ${errore}`);
    }
  }
  return errori;
}
