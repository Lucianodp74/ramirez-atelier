// Contenuti della home: showroom 3D.
// Solo dati già presenti nel sito (indirizzo, email, "dal 1987"); i testi descrittivi
// raccontano ciò che i modelli mostrano e restano da validare con l'atelier.

export const BASE = '/home';

export type IdFinitura = 'rovere' | 'noce' | 'avorio' | 'antracite';

export const FINITURE: Record<
  IdFinitura,
  { nome: string; texture?: string; colore: string; ruvidita: number; campione: string }
> = {
  rovere: {
    nome: 'Rovere',
    texture: `${BASE}/texture/rovere.jpg`,
    colore: '#ffffff',
    ruvidita: 0.55,
    campione: '#B48A5A',
  },
  noce: {
    nome: 'Noce',
    texture: `${BASE}/texture/noce.jpg`,
    colore: '#ffffff',
    ruvidita: 0.45,
    campione: '#7A5236',
  },
  avorio: { nome: 'Laccato avorio', colore: '#cdc2ae', ruvidita: 0.38, campione: '#E6DED1' },
  antracite: { nome: 'Laccato antracite', colore: '#1f1d1b', ruvidita: 0.42, campione: '#2A2724' },
};

export type Tappa = {
  id: string;
  sovratitolo: string;
  titolo: string;
  testo: string;
  /** indice dell'arredo nella scena; null = vista d'insieme */
  arredo: number | null;
  finiture?: IdFinitura[];
  led?: boolean;
  immagine: string;
  alt: string;
};

export const TAPPE: Tappa[] = [
  {
    id: 'insieme',
    sovratitolo: 'Lo showroom',
    titolo: 'Cinque arredi, un solo modo di lavorare.',
    testo:
      'Scorri per avvicinarti a ciascun pezzo: materiali, proporzioni, dettagli. Gli arredi in 3D sono dimostrativi.',
    arredo: null,
    immagine: `${BASE}/img/stella-panorama.jpg`,
    alt: 'Madia STELLA in radica d’olivo',
  },
  {
    id: 'madia',
    sovratitolo: 'Arredi unici',
    titolo: 'Madia STELLA',
    testo: 'Ante in radica d’olivo, prese a stella in pietra, struttura in noce.',
    arredo: 0,
    immagine: `${BASE}/img/stella-panorama.jpg`,
    alt: 'Madia STELLA in radica d’olivo con maniglie a stella in pietra',
  },
  {
    id: 'libreria',
    sovratitolo: 'Librerie e pareti',
    titolo: 'Libreria a tutta parete',
    testo:
      'Cinque moduli con ripiani spessi, cornice superiore e luce sotto ogni ripiano. La venatura corre continua da un pezzo all’altro.',
    arredo: 1,
    finiture: ['rovere', 'noce', 'avorio', 'antracite'],
    led: true,
    immagine: `${BASE}/img/libreria.jpg`,
    alt: 'Libreria in rovere con ripiani illuminati',
  },
  {
    id: 'cucina',
    sovratitolo: 'Cucine su misura',
    titolo: 'Cucina con isola',
    testo:
      'Colonne con forno incassato, pensili senza maniglie, piano e alzata in pietra. Davanti, l’isola con piano a cascata e piano cottura a filo.',
    arredo: 2,
    finiture: ['avorio', 'antracite', 'rovere', 'noce'],
    led: true,
    immagine: `${BASE}/img/cucina.jpg`,
    alt: 'Cucina laccata avorio con isola in pietra',
  },
  {
    id: 'armadio',
    sovratitolo: 'Armadi',
    titolo: 'Parete armadio',
    testo:
      'Sei ante a tutta altezza con maniglie a barra in bronzo. Il vano aperto mostra l’interno: ripiano illuminato, appendiabiti e cassettiera.',
    arredo: 3,
    finiture: ['noce', 'rovere', 'avorio', 'antracite'],
    led: true,
    immagine: `${BASE}/img/armadio.jpg`,
    alt: 'Parete armadio in noce',
  },
  {
    id: 'boiserie',
    sovratitolo: 'Boiserie',
    titolo: 'Boiserie a pannelli',
    testo:
      'Pannelli bugnati con cornici a doppio gradino tagliate a 45°, zoccolo, fascia e cornicione a più livelli, con applique in bronzo.',
    arredo: 4,
    finiture: ['avorio', 'rovere', 'noce', 'antracite'],
    led: true,
    immagine: `${BASE}/img/boiserie.jpg`,
    alt: 'Boiserie in rovere a pannelli',
  },
];

/** Arredi in scena, nell'ordine della visita. */
export const ARREDI = [
  { file: `${BASE}/modelli/madia.glb`, finitura: null },
  { file: `${BASE}/modelli/libreria.glb`, finitura: 'rovere' as IdFinitura },
  { file: `${BASE}/modelli/cucina.glb`, finitura: 'avorio' as IdFinitura },
  { file: `${BASE}/modelli/armadio.glb`, finitura: 'noce' as IdFinitura },
  { file: `${BASE}/modelli/boiserie.glb`, finitura: 'avorio' as IdFinitura },
] as const;

/** Distanza tra le "stanze" dello showroom, in metri. */
export const PASSO = 5;
