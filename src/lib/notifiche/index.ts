import type { InvioEmailAdapter } from './tipi';
import { ConsoleEmailAdapter } from './console';

export type { InvioEmailAdapter } from './tipi';

let istanza: InvioEmailAdapter | null = null;

/**
 * Nessuna variabile d'ambiente per un provider reale esiste ancora (v.
 * DEPLOY-RUNBOOK.md, Fase 0 - "richiede un piccolo intervento di sviluppo
 * non ancora fatto"): questa factory usa sempre l'adattatore console per
 * ora. Quando verrà scelto un provider reale, questa funzione si estenderà
 * con lo stesso identico pattern già usato per lo storage - non prima.
 */
export function getEmailAdapter(): InvioEmailAdapter {
  if (istanza) return istanza;
  istanza = new ConsoleEmailAdapter();
  return istanza;
}
