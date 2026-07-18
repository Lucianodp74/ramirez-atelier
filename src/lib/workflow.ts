import type { StatoRichiesta } from '@prisma/client';

/**
 * Transizioni ammesse per ciascuno stato. BOZZA non compare come sorgente: si esce
 * da BOZZA solo tramite completaRichiesta (Incremento 2), mai da un cambio di stato
 * manuale in dashboard. CHIUSA è raggiungibile da ogni stato attivo (una richiesta
 * può essere persa/rifiutata in qualunque momento del percorso).
 *
 * Estendere il workflow (es. aggiungere uno stato "In attesa del cliente") significa
 * aggiungere una voce qui, non cercare condizionali sparsi nel codice - come richiesto.
 */
export const TRANSIZIONI_AMMESSE: Partial<Record<StatoRichiesta, StatoRichiesta[]>> = {
  NUOVA: ['IN_REVISIONE', 'CHIUSA'],
  IN_REVISIONE: ['PREVENTIVO_INVIATO', 'CHIUSA'],
  PREVENTIVO_INVIATO: ['CONVERTITA', 'CHIUSA'],
  CONVERTITA: ['CHIUSA'],
  CHIUSA: [],
};

export const ETICHETTA_STATO: Record<StatoRichiesta, string> = {
  BOZZA: 'Bozza',
  NUOVA: 'Nuova',
  IN_REVISIONE: 'In revisione',
  PREVENTIVO_INVIATO: 'Preventivo inviato',
  CONVERTITA: 'Convertita',
  CHIUSA: 'Chiusa',
};

/** Stati mostrati in dashboard: una richiesta ancora in BOZZA non è "arrivata" al titolare. */
export const STATI_OPERATIVI: StatoRichiesta[] = [
  'NUOVA',
  'IN_REVISIONE',
  'PREVENTIVO_INVIATO',
  'CONVERTITA',
  'CHIUSA',
];

export function transizioneAmmessa(da: StatoRichiesta, a: StatoRichiesta): boolean {
  return (TRANSIZIONI_AMMESSE[da] ?? []).includes(a);
}

export function prossimiStatiPossibili(da: StatoRichiesta): StatoRichiesta[] {
  return TRANSIZIONI_AMMESSE[da] ?? [];
}
