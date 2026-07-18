import { z } from 'zod';

/**
 * Questo file definisce la FORMA della configurazione che rende ogni TipoProgetto
 * (Cucina, Armadio, Living, Bagno, ...) un flusso a sé, senza scrivere codice React
 * dedicato per ciascuno. Aggiungere un nuovo tipo di progetto significa scrivere una
 * nuova riga di configurazione conforme a questo schema, mai un nuovo componente.
 *
 * Il wizard (src/components/wizard/*) legge esclusivamente questa struttura per
 * decidere quali step mostrare, quali campi chiedere, come calcolare l'indice di
 * completezza e quali campi partecipano alla valutazione economica (Rule Engine, contesto preventivo_pricing).
 */

export const TipoCampoSchema = z.enum([
  'testo',
  'testo_lungo',
  'numero',
  'select',
  'select_immagine',
  'data',
]);
export type TipoCampo = z.infer<typeof TipoCampoSchema>;

export const OpzioneCampoSchema = z.object({
  valore: z.string(),
  etichetta: z.string(),
  immagine: z.string().optional(),
  descrizione: z.string().optional(),
});
export type OpzioneCampo = z.infer<typeof OpzioneCampoSchema>;

export const RegolaValidazioneSchema = z.object({
  minimo: z.number().optional(), // per campi numerici
  massimo: z.number().optional(),
  lunghezzaMinima: z.number().optional(), // per campi testo
  lunghezzaMassima: z.number().optional(),
  pattern: z.string().optional(), // regex come stringa, applicata con "new RegExp(pattern)"
  messaggioPattern: z.string().optional(), // messaggio d'errore se il pattern non combacia
});
export type RegolaValidazione = z.infer<typeof RegolaValidazioneSchema>;

export const CampoConfigurazioneSchema = z.object({
  chiave: z.string(), // identificatore univoco nel datiFormJson della richiesta
  etichetta: z.string(),
  tipo: TipoCampoSchema,
  obbligatorio: z.boolean().default(false),
  placeholder: z.string().optional(),
  aiutoTesto: z.string().optional(), // testo/esempio che accompagna la scelta (UX guidata, non questionario)
  opzioni: z.array(OpzioneCampoSchema).optional(), // per select / select_immagine - statiche, definite qui
  /**
   * Se valorizzato, le `opzioni` NON vengono lette da questo JSON ma risolte a
   * runtime da una fonte dati esterna (es. "fascia_budget" → tabella FasciaBudget),
   * perché sono dati amministrabili che cambiano nel tempo e non devono richiedere
   * di editare la configurazione del tipo di progetto per essere aggiornati.
   * V. src/lib/configurazione-dinamica.ts per il resolver.
   */
  fonteOpzioni: z.string().optional(),
  pesoCompletezza: z.number().min(0).max(100).default(0), // contributo al calcolo indice completezza
  /** Se valorizzato, il valore di questo campo viene esposto come fatto (chiave = questo valore) al Rule Engine per la valutazione del prezzo - niente bucketing nel dominio, gli intervalli si esprimono nelle condizioni della Regola stessa (operatori "tra"/"maggiore_uguale"). */
  chiavePricing: z.string().optional(),
  /** Regole di validazione dichiarative - MAI logica scritta nel componente React (Requisito 3) */
  validazione: RegolaValidazioneSchema.optional(),
});
export type CampoConfigurazione = z.infer<typeof CampoConfigurazioneSchema>;

export const StepConfigurazioneSchema = z.object({
  chiave: z.string(),
  titolo: z.string(),
  sottotitolo: z.string().optional(),
  immagineIntro: z.string().optional(),
  campi: z.array(CampoConfigurazioneSchema),
});
export type StepConfigurazione = z.infer<typeof StepConfigurazioneSchema>;

export const TipoProgettoConfigurazioneSchema = z.object({
  step: z.array(StepConfigurazioneSchema).min(1),
});
export type TipoProgettoConfigurazione = z.infer<typeof TipoProgettoConfigurazioneSchema>;

/**
 * Calcola l'indice di completezza (0-100) di una richiesta, dati i pesi definiti
 * nella configurazione del tipo di progetto e le risposte effettivamente fornite.
 *
 * Regola: un campo "conta" solo se ha una risposta non vuota. La somma dei pesi
 * dei campi valorizzati, diviso la somma di tutti i pesi definiti, dà la percentuale.
 * Se la configurazione non definisce pesi (somma = 0), ritorna 0 per evitare divisioni
 * per zero e per segnalare esplicitamente una configurazione incompleta.
 */
export function calcolaIndiceCompletezza(
  configurazione: TipoProgettoConfigurazione,
  datiForm: Record<string, unknown>,
): number {
  let pesoTotale = 0;
  let pesoRaggiunto = 0;

  for (const step of configurazione.step) {
    for (const campo of step.campi) {
      pesoTotale += campo.pesoCompletezza;
      const valore = datiForm[campo.chiave];
      const valorizzato =
        valore !== undefined && valore !== null && String(valore).trim().length > 0;
      if (valorizzato) {
        pesoRaggiunto += campo.pesoCompletezza;
      }
    }
  }

  if (pesoTotale === 0) return 0;
  return Math.round((pesoRaggiunto / pesoTotale) * 100);
}

/**
 * Campi del wizard che, per convenzione condivisa con lo schema Prisma, non
 * finiscono dentro `datiFormJson` ma su una colonna dedicata di `RichiestaProgetto`.
 * Il wizard resta comunque generico: non "sa" cosa significhi `clienteNome`, si
 * limita a guardare se la chiave del campo è in questa lista per decidere dove
 * il server action deve scrivere il valore. Aggiungere/togliere un campo riservato
 * è una decisione di schema (Prisma), mai di componente React.
 */
export const CAMPI_RISERVATI = [
  'clienteNome',
  'clienteEmail',
  'clienteTelefono',
  'clienteTipo',
  'clienteAzienda',
  'budgetDichiarato',
  'fasciaBudgetId',
  'dataDesiderata',
  'messaggioLibero',
] as const;
export type CampoRiservato = (typeof CAMPI_RISERVATI)[number];

export function isCampoRiservato(chiave: string): chiave is CampoRiservato {
  return (CAMPI_RISERVATI as readonly string[]).includes(chiave);
}

/**
 * Valida un singolo campo secondo le regole dichiarate nella sua configurazione
 * (Requisito 3: nessuna validazione scritta nel componente). Ritorna il messaggio
 * d'errore da mostrare, oppure null se il valore è valido.
 */
export function validaCampo(campo: CampoConfigurazione, valore: unknown): string | null {
  const vuoto = valore === undefined || valore === null || String(valore).trim().length === 0;

  if (campo.obbligatorio && vuoto) {
    return `${campo.etichetta} è un campo obbligatorio.`;
  }
  if (vuoto) return null; // campo opzionale non compilato: nessun'altra regola si applica

  const v = campo.validazione;
  if (!v) return null;

  if (campo.tipo === 'numero') {
    const numero = Number(valore);
    if (Number.isNaN(numero)) return `${campo.etichetta} deve essere un numero.`;
    if (v.minimo !== undefined && numero < v.minimo) {
      return `${campo.etichetta} deve essere almeno ${v.minimo}.`;
    }
    if (v.massimo !== undefined && numero > v.massimo) {
      return `${campo.etichetta} non può superare ${v.massimo}.`;
    }
  }

  if (campo.tipo === 'testo' || campo.tipo === 'testo_lungo') {
    const testo = String(valore);
    if (v.lunghezzaMinima !== undefined && testo.length < v.lunghezzaMinima) {
      return `${campo.etichetta} deve contenere almeno ${v.lunghezzaMinima} caratteri.`;
    }
    if (v.lunghezzaMassima !== undefined && testo.length > v.lunghezzaMassima) {
      return `${campo.etichetta} non può superare ${v.lunghezzaMassima} caratteri.`;
    }
    if (v.pattern) {
      const regex = new RegExp(v.pattern);
      if (!regex.test(testo)) {
        return v.messaggioPattern ?? `${campo.etichetta} non è nel formato atteso.`;
      }
    }
  }

  return null;
}

/** Valida tutti i campi di uno step. Ritorna una mappa chiave campo → messaggio d'errore. */
export function validaStep(
  step: StepConfigurazione,
  datiForm: Record<string, unknown>,
): Record<string, string> {
  const errori: Record<string, string> = {};
  for (const campo of step.campi) {
    const errore = validaCampo(campo, datiForm[campo.chiave]);
    if (errore) errori[campo.chiave] = errore;
  }
  return errori;
}

/** Valida l'intera configurazione (tutti gli step), usato al completamento finale. */
export function validaConfigurazioneCompleta(
  configurazione: TipoProgettoConfigurazione,
  datiForm: Record<string, unknown>,
): Record<string, string> {
  let errori: Record<string, string> = {};
  for (const step of configurazione.step) {
    errori = { ...errori, ...validaStep(step, datiForm) };
  }
  return errori;
}

export interface StepMancante {
  chiave: string;
  titolo: string;
  percentualeStep: number; // completezza del singolo step, 0-100
}

/**
 * Elenca gli step non ancora completi, con la percentuale di completamento di
 * ciascuno - usato dalla UI di progressione ("Requisito 2: step mancanti").
 */
export function calcolaStepMancanti(
  configurazione: TipoProgettoConfigurazione,
  datiForm: Record<string, unknown>,
): StepMancante[] {
  const risultato: StepMancante[] = [];

  for (const step of configurazione.step) {
    let pesoTotale = 0;
    let pesoRaggiunto = 0;
    for (const campo of step.campi) {
      pesoTotale += campo.pesoCompletezza;
      const valore = datiForm[campo.chiave];
      const valorizzato =
        valore !== undefined && valore !== null && String(valore).trim().length > 0;
      if (valorizzato) pesoRaggiunto += campo.pesoCompletezza;
    }
    const percentualeStep = pesoTotale === 0 ? 100 : Math.round((pesoRaggiunto / pesoTotale) * 100);
    if (percentualeStep < 100) {
      risultato.push({ chiave: step.chiave, titolo: step.titolo, percentualeStep });
    }
  }

  return risultato;
}

export type LivelloCompletezza = 'appena_iniziata' | 'in_corso' | 'quasi_completa' | 'completa';

/** Traduce la percentuale in un livello qualitativo, per un linguaggio più umano in UI. */
export function livelloCompletezza(percentuale: number): LivelloCompletezza {
  if (percentuale >= 100) return 'completa';
  if (percentuale >= 70) return 'quasi_completa';
  if (percentuale >= 25) return 'in_corso';
  return 'appena_iniziata';
}

export const ETICHETTA_LIVELLO_COMPLETEZZA: Record<LivelloCompletezza, string> = {
  appena_iniziata: 'Appena iniziata',
  in_corso: 'In corso',
  quasi_completa: 'Quasi completa',
  completa: 'Completa',
};
