import type { ModuloConfigurato, ModuloTipo } from './moduli';

/**
 * TIPO DI PROGETTO - prima schermata del Preventivatore ("Cosa vuoi
 * realizzare?"). Etichetta della richiesta e scorciatoia per preparare i
 * moduli: non entra nel calcolo della stima.
 */
export type TipoProgetto =
  'ARMADIO' | 'PARETE_ATTREZZATA' | 'MADIA' | 'LIBRERIA' | 'MOBILE_BAGNO' | 'ALTRO';

/** Tipo di modulo che ogni scelta imposta sul modulo selezionato. */
const TIPO_MODULO_PER_PROGETTO: Partial<Record<TipoProgetto, ModuloTipo>> = {
  LIBRERIA: 'LIBRERIA',
  PARETE_ATTREZZATA: 'LIBRERIA',
  MADIA: 'BASE',
  MOBILE_BAGNO: 'BASE',
};

/**
 * Tipo di progetto con cui aprire il wizard. Una composizione di sole
 * librerie (es. un modello del Catalogo Librerie) si presenta come
 * "Libreria"; senza moduli iniziali, o con moduli misti, resta "Mobile su
 * misura" come sempre.
 */
export function tipoProgettoIniziale(moduliIniziali?: readonly ModuloConfigurato[]): TipoProgetto {
  if (moduliIniziali?.length && moduliIniziali.every((modulo) => modulo.tipo === 'LIBRERIA')) {
    return 'LIBRERIA';
  }
  return 'ALTRO';
}

export type EffettoTipoProgetto =
  | { tipo: 'NESSUNO' }
  /** Il modulo selezionato torna ai valori predefiniti del nuovo tipo. */
  | { tipo: 'CAMBIA_TIPO_MODULO'; tipoModulo: ModuloTipo }
  /** Tutti i moduli vengono sostituiti dalla composizione armadio. */
  | { tipo: 'COMPOSIZIONE_ARMADIO' };

/**
 * Che cosa fa ai moduli la scelta di un tipo di progetto.
 *
 * Senza composizione iniziale il comportamento è quello di sempre. Con una
 * composizione da conservare (moduli arrivati dal catalogo o da un progetto
 * preimpostato), scegliere un tipo già corrispondente al modulo selezionato
 * non lo azzera: resta com'è.
 */
export function effettoSceltaTipoProgetto(
  tipoProgetto: TipoProgetto,
  moduloSelezionato: ModuloConfigurato,
  { composizioneDaConservare = false }: { composizioneDaConservare?: boolean } = {},
): EffettoTipoProgetto {
  if (tipoProgetto === 'ARMADIO') return { tipo: 'COMPOSIZIONE_ARMADIO' };
  const tipoModulo = TIPO_MODULO_PER_PROGETTO[tipoProgetto];
  if (!tipoModulo) return { tipo: 'NESSUNO' };
  if (composizioneDaConservare && moduloSelezionato.tipo === tipoModulo) return { tipo: 'NESSUNO' };
  return { tipo: 'CAMBIA_TIPO_MODULO', tipoModulo };
}

/**
 * Testo della conferma richiesta prima di modificare una composizione da
 * conservare; null quando la scelta non tocca i moduli.
 */
export function confermaSostituzione(effetto: EffettoTipoProgetto): string | null {
  if (effetto.tipo === 'COMPOSIZIONE_ARMADIO') {
    return 'Questa scelta sostituisce tutti i moduli della composizione di partenza con un armadio predefinito. Vuoi continuare?';
  }
  if (effetto.tipo === 'CAMBIA_TIPO_MODULO') {
    return 'Questa scelta riporta il modulo selezionato ai valori predefiniti e ne cambia misure e finiture. Vuoi continuare?';
  }
  return null;
}
