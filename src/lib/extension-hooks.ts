/**
 * Punti di estensione per le fasi future della roadmap (v. ADR-0001, ADR-0002).
 *
 * Questo file NON contiene alcuna logica di intelligenza artificiale, OCR, parsing
 * CAD, computer vision, calcolo di preventivi o sincronizzazione CRM. Contiene solo
 * le interfacce tipizzate a cui quella logica si aggancerà, e un registry con
 * implementazioni "assenti" esplicite (mai finte/simulate silenziosamente) — così
 * che il resto del codice possa già chiamare questi hook nel punto corretto del
 * flusso, senza dover essere riscritto quando le fasi D/E/F/G verranno implementate.
 *
 * Principio: se un hook non è implementato, chi lo chiama deve saperlo (riceve
 * `null`), non deve ricevere un risultato finto che sembri vero.
 */

import type { RichiestaProgetto, DocumentoRichiesta } from '@prisma/client';

/** Fase E/F (ADR-0002): estrazione automatica da documenti non strutturati. */
export interface EsitoEstrazioneDocumentale {
  campiSuggeriti: Record<string, unknown>;
  livelloConfidenza: number; // 0-1
  note: string;
}
export interface EstrattoreDocumentaleHook {
  estrai(documento: DocumentoRichiesta): Promise<EsitoEstrazioneDocumentale | null>;
}

/** Fase D (ADR-0002): suggerimento prezzo assistito da AI, oltre alle regole configurabili. */
export interface EsitoSuggerimentoPrezzo {
  fasciaMin: number;
  fasciaMax: number;
  motivazione: string;
  livelloConfidenza: number;
}
export interface SuggeritorePrezzoAIHook {
  suggerisci(richiesta: RichiestaProgetto): Promise<EsitoSuggerimentoPrezzo | null>;
}

/** Integrazione futura con ArtigianOS CRM (Bounded Context CRM, v. Enterprise Domain Model). */
export interface EsitoSincronizzazioneCRM {
  clienteIdArtigianOS: string;
  commessaIdArtigianOS?: string;
}
export interface SincronizzatoreCRMHook {
  sincronizza(richiesta: RichiestaProgetto): Promise<EsitoSincronizzazioneCRM | null>;
}

/** Integrazione futura con il Preventivatore di ArtigianOS (genera una bozza di preventivo). */
export interface EsitoBozzaPreventivo {
  preventivoIdArtigianOS: string;
  prezzoSuggerito: number;
}
export interface GeneratoreBozzaPreventivoHook {
  genera(richiesta: RichiestaProgetto): Promise<EsitoBozzaPreventivo | null>;
}

/**
 * Registry centrale degli hook. Ogni voce è `null` finché la fase corrispondente
 * non viene implementata: nessun hook produce output simulato.
 */
export const hookEstensione: {
  estrattoreDocumentale: EstrattoreDocumentaleHook | null;
  suggeritorePrezzoAI: SuggeritorePrezzoAIHook | null;
  sincronizzatoreCRM: SincronizzatoreCRMHook | null;
  generatoreBozzaPreventivo: GeneratoreBozzaPreventivoHook | null;
} = {
  estrattoreDocumentale: null, // Fase E/F - non implementato in questo incremento
  suggeritorePrezzoAI: null, // Fase D - non implementato in questo incremento
  sincronizzatoreCRM: null, // Integrazione ArtigianOS - non implementato in questo incremento
  generatoreBozzaPreventivo: null, // Integrazione ArtigianOS - non implementato in questo incremento
};
