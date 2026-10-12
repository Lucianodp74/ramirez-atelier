// Contenuti del prototipo "homepage premium".
// Solo informazioni già presenti nel sito attuale (indirizzo, email, P.IVA, "dal 1987");
// i testi descrittivi sono proposte da validare, segnalate come tali nella pagina.

export const ASSET = '/prototipi/homepage-premium';

export const CONTATTI = {
  email: 'info@ramirezatelier.it',
  indirizzo: ['Via S. Andrea, Zona Artigianale', 'Borgagne di Melendugno, 73026'],
  ragioneSociale: 'ITALDESIGN DI RAMIREZ ROBERTO · P.IVA 04951160755',
} as const;

export const NAVIGAZIONE = [
  { href: '#realizzazioni', etichetta: 'Realizzazioni' },
  { href: '#lavorazioni', etichetta: 'Lavorazioni' },
  { href: '#metodo', etichetta: 'Metodo' },
  { href: '#contatti', etichetta: 'Contatti' },
] as const;

export const LAVORAZIONI = [
  {
    titolo: 'Cucine su misura',
    testo:
      'Basi, colonne e piani progettati sulle misure reali della stanza e sul modo in cui la vivi.',
    immagine: `${ASSET}/cucina.jpg`,
    alt: 'Cucina lineare laccata avorio con colonne a tutta altezza e mensola illuminata',
  },
  {
    titolo: 'Armadi e cabine armadio',
    testo: 'Pareti contenitive a tutta altezza, organizzate dentro come servono a te.',
    immagine: `${ASSET}/armadio.jpg`,
    alt: 'Parete armadio in noce con maniglie verticali in bronzo',
  },
  {
    titolo: 'Boiserie',
    testo: 'Rivestimenti in legno che disegnano la parete e danno misura all’ambiente.',
    immagine: `${ASSET}/boiserie.jpg`,
    alt: 'Boiserie in rovere a pannelli con cornici e consolle sospesa',
  },
  {
    titolo: 'Librerie e pareti attrezzate',
    testo: 'Moduli, vani e luci pensati attorno ai tuoi libri e ai tuoi oggetti.',
    immagine: `${ASSET}/libreria.jpg`,
    alt: 'Libreria in rovere a quattro moduli con ante basse e ripiani illuminati',
  },
  {
    titolo: 'Arredi personalizzati',
    testo: 'Pezzi unici come la madia STELLA: un’idea, un materiale, un dettaglio da ricordare.',
    immagine: `${ASSET}/stella-dettaglio.jpg`,
    alt: 'Dettaglio della madia STELLA: anta in radica d’olivo con maniglia a stella in pietra',
  },
] as const;

export const METODO = [
  {
    titolo: 'Ascolto',
    testo:
      'Partiamo da come vivi lo spazio: abitudini, oggetti da custodire, idee anche solo abbozzate.',
  },
  {
    titolo: 'Progetto e misure',
    testo: 'Disegno e rilievo definiscono proporzioni, ingombri e funzionamento di ogni elemento.',
  },
  {
    titolo: 'Materiali e finiture',
    testo: 'Legni, laccati, pietre e ferramenta si scelgono dal vero, con campioni da toccare.',
  },
  {
    titolo: 'Realizzazione',
    testo: 'Il lavoro prende forma in laboratorio, dove ogni pezzo viene costruito e rifinito.',
  },
  {
    titolo: 'Installazione',
    testo: 'Montaggio e regolazioni finali a casa tua, fino alla consegna.',
  },
] as const;

export const GALLERIA = [
  {
    immagine: `${ASSET}/stella-panorama.jpg`,
    alt: 'Madia STELLA in radica d’olivo illuminata dalla luce di una finestra',
    didascalia: 'STELLA · madia in radica d’olivo',
    formato: 'ampio',
  },
  {
    immagine: `${ASSET}/libreria-dettaglio.jpg`,
    alt: 'Dettaglio di una libreria in noce: ante con maniglie in bronzo, libri e un vaso sui ripiani',
    didascalia: 'Libreria in noce · dettaglio',
    formato: 'alto',
  },
  {
    immagine: `${ASSET}/boiserie.jpg`,
    alt: 'Boiserie in rovere a pannelli',
    didascalia: 'Boiserie in rovere',
    formato: 'alto',
  },
  {
    immagine: `${ASSET}/cucina.jpg`,
    alt: 'Cucina laccata avorio',
    didascalia: 'Cucina laccata avorio',
    formato: 'largo',
  },
  {
    immagine: `${ASSET}/armadio.jpg`,
    alt: 'Parete armadio in noce',
    didascalia: 'Parete armadio in noce',
    formato: 'normale',
  },
  {
    immagine: `${ASSET}/stella-dettaglio.jpg`,
    alt: 'Maniglia a stella in pietra su anta in radica',
    didascalia: 'STELLA · dettaglio della maniglia',
    formato: 'normale',
  },
] as const;
