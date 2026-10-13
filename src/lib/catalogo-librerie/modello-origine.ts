import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';
import {
  FORMATO_CODICE_MODELLO,
  MODELLI_LIBRERIE,
  famigliaPerCodice,
  moduliPerPreventivatore,
  trovaModello,
  type ModelloLibreria,
  type OpzioniAccesso,
} from './catalogo';

/**
 * MODELLO D'ORIGINE - traccia del modello di catalogo da cui è partita una
 * richiesta del Preventivatore.
 *
 * Salvato dentro `datiEstensione.preventivatoreModulare.modelloOrigine`,
 * accanto alla configurazione inviata dal cliente: il modello dice da dove
 * si è partiti, `moduli` dice che cosa è stato chiesto. Nome e famiglia sono
 * copiati al momento della richiesta, così restano leggibili anche se il
 * catalogo cambia o il modello viene ritirato.
 *
 * Solo dato descrittivo: non entra nel calcolo della stima, nella BOM né
 * nel flusso verso la commessa, e non contiene prezzi o costi.
 */
export interface ModelloOrigine {
  codice: string;
  nome: string;
  famiglia: string;
  nomeFamiglia: string;
  /** true se il cliente ha cambiato la configurazione proposta dal modello. */
  personalizzato: boolean;
}

/** I soli campi che descrivono un modulo: l'identificativo non conta. */
function firmaModulo(modulo: ModuloConfigurato): string {
  return JSON.stringify([
    modulo.tipo,
    modulo.larghezzaCm,
    modulo.altezzaCm,
    modulo.profonditaCm,
    modulo.materiale,
    modulo.finitura,
    modulo.materialeAnte ?? modulo.materiale,
    modulo.finituraStruttura ?? modulo.finitura,
    modulo.finituraAnte ?? modulo.finitura,
    modulo.configurazione,
    modulo.ripiani ?? 0,
  ]);
}

/** Stessa configurazione se i moduli coincidono, nello stesso ordine. */
export function stessaConfigurazione(a: ModuloConfigurato[], b: ModuloConfigurato[]): boolean {
  return a.length === b.length && a.every((modulo, i) => firmaModulo(modulo) === firmaModulo(b[i]));
}

/**
 * Convalida lato server il codice ricevuto dal browser, mai considerato
 * affidabile. Restituisce null - e la richiesta viene salvata comunque,
 * senza modello d'origine - se il codice è assente, malformato, inesistente
 * o se il modello non poteva avviare una richiesta per chi la invia.
 */
export function risolviModelloOrigine(
  codice: unknown,
  moduli: ModuloConfigurato[],
  { anteprimaInterna = false }: OpzioniAccesso = {},
  catalogo: readonly ModelloLibreria[] = MODELLI_LIBRERIE,
): ModelloOrigine | null {
  if (typeof codice !== 'string') return null;
  // Stessa regola di ammissione del Preventivatore (stato del modello e
  // validità della composizione): un modello che non può aprirlo non può
  // esserne l'origine.
  const proposti = moduliPerPreventivatore(codice, { anteprimaInterna }, catalogo);
  const modello = trovaModello(codice, catalogo);
  if (!proposti || !modello) return null;

  return {
    codice: modello.codice,
    nome: modello.nome,
    famiglia: modello.famiglia,
    nomeFamiglia: famigliaPerCodice(modello.famiglia).nome,
    personalizzato: !stessaConfigurazione(moduli, proposti),
  };
}

function isRecord(valore: unknown): valore is Record<string, unknown> {
  return !!valore && typeof valore === 'object' && !Array.isArray(valore);
}

/**
 * Lettura difensiva del campo da `RichiestaProgetto.datiEstensione`: JSON
 * salvato, quindi mai dato per buono. Le richieste senza modello d'origine
 * (tutte quelle precedenti e quelle nate senza catalogo) restituiscono null.
 */
export function leggiModelloOrigine(datiEstensione: unknown): ModelloOrigine | null {
  if (!isRecord(datiEstensione)) return null;
  const snapshot = datiEstensione.preventivatoreModulare;
  if (!isRecord(snapshot)) return null;
  const origine = snapshot.modelloOrigine;
  if (!isRecord(origine)) return null;
  const { codice, nome, famiglia, nomeFamiglia, personalizzato } = origine;
  if (typeof codice !== 'string' || !FORMATO_CODICE_MODELLO.test(codice)) return null;
  if (typeof nome !== 'string' || typeof famiglia !== 'string') return null;
  return {
    codice,
    nome,
    famiglia,
    nomeFamiglia: typeof nomeFamiglia === 'string' ? nomeFamiglia : famiglia,
    personalizzato: personalizzato === true,
  };
}
