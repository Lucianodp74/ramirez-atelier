import type { Azione, Fatti, ContestoEsecuzione } from './tipi';

export type GestoreAzione = (
  parametri: Record<string, unknown>,
  fatti: Fatti,
  contesto: ContestoEsecuzione,
) => Promise<Record<string, unknown> | void>;

const registro = new Map<string, GestoreAzione>();

/**
 * Registra un gestore per un tipo di azione. Va chiamato una volta, all'avvio
 * dell'applicazione (o comunque prima che una regola con quell'azione venga
 * valutata) - v. src/lib/rule-engine/bootstrap.ts per la registrazione centrale
 * di questo progetto.
 */
export function registraGestoreAzione(tipo: string, gestore: GestoreAzione): void {
  registro.set(tipo, gestore);
}

export function azioneRegistrata(tipo: string): boolean {
  return registro.has(tipo);
}

/**
 * Esegue un'azione cercandola nel registro. Se nessun dominio ha registrato un
 * gestore per questo tipo, fallisce esplicitamente - il motore non esegue mai
 * un'azione "a vuoto" silenziosamente, per non nascondere un errore di
 * configurazione (una regola che referenzia un'azione inesistente).
 */
export async function eseguiAzione(
  azione: Azione,
  fatti: Fatti,
  contesto: ContestoEsecuzione,
): Promise<Record<string, unknown> | void> {
  const gestore = registro.get(azione.tipo);
  if (!gestore) {
    throw new Error(
      `Nessun gestore registrato per l'azione "${azione.tipo}" (contesto entità: ${contesto.entitaTipo}).`,
    );
  }
  return gestore(azione.parametri, fatti, contesto);
}

/** Esposta solo per i test: azzera il registro senza dover riavviare il processo. */
export function _svuotaRegistroPerTest(): void {
  registro.clear();
}
