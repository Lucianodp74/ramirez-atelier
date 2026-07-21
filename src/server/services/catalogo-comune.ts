import { db } from '@/server/db';

/** Identificatore tecnico stabile a partire da un nome commerciale - mai
 * rigenerato dopo la creazione (v. ciascun servizio che lo usa). */
export function generaSlug(nome: string): string {
  return nome
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuove accenti
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Calcola l'ordinamento in coda alla categoria quando non specificato
 * esplicitamente (v. Configurazione a Valore - "il sistema può dedurlo?"):
 * il titolare non deve mai indovinare un numero libero alla creazione. */
export function prossimoOrdinamento(esistentiStessaCategoria: { ordinamento: number }[]): number {
  return esistentiStessaCategoria.length > 0
    ? Math.max(...esistentiStessaCategoria.map((f) => f.ordinamento)) + 1
    : 0;
}

/**
 * Verifica se un valore (lo slug di una Finitura, Ferramenta o Accessorio)
 * compare tra i valori salvati di qualunque richiesta del tenant. Non è una
 * relazione (il wizard salva le risposte in una struttura libera, per
 * restare generico su qualunque tipo di progetto - principio stabilito fin
 * dall'inizio), quindi è una ricerca, non un conteggio - accettabile ai
 * volumi di un atelier, da rivedere se i volumi crescessero molto.
 */
export async function valoreUsatoInRichieste(tenantId: string, valore: string): Promise<boolean> {
  const richieste = await db.richiestaProgetto.findMany({ where: { tenantId } });
  return richieste.some((r) => {
    const dati = (r.datiFormJson as Record<string, unknown>) ?? {};
    return Object.values(dati).includes(valore);
  });
}
