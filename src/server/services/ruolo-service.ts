import { db } from '@/server/db';

export async function elencoRuoli(tenantId: string) {
  return db.ruolo.findMany({ where: { tenantId }, include: { permessi: true } });
}

export async function creaRuolo(tenantId: string, nome: string, descrizione?: string) {
  return db.ruolo.create({ data: { tenantId, nome, descrizione: descrizione ?? null } });
}

export async function assegnaPermesso(ruoloId: string, modulo: string, azione: string) {
  return db.permesso.create({ data: { ruoloId, modulo, azione } });
}

export async function revocaPermesso(permessoId: string) {
  return db.permesso.delete({ where: { id: permessoId } });
}

/**
 * Catalogo dei moduli/azioni riconosciuti da questo progetto - usato per
 * popolare l'interfaccia di gestione ruoli con opzioni valide, non per
 * validare rigidamente (un modulo futuro può aggiungersi qui senza toccare
 * il dominio di Identity & Security, coerente con Principio 3).
 */
export const CATALOGO_MODULI_AZIONI: Record<string, string[]> = {
  richieste: ['leggi', 'gestisci', 'cambia_stato', 'commenta'],
  fasce_budget: ['leggi', 'gestisci'],
  regole: ['leggi', 'gestisci'],
  utenti: ['leggi', 'gestisci'],
  kpi: ['leggi'],
  catalogo: ['leggi', 'gestisci'],
  clienti: ['leggi', 'gestisci'],
};

/**
 * Aggiunge al Ruolo indicato i permessi del catalogo non ancora presenti -
 * mai duplica quelli esistenti. Necessario perché il seed crea un Ruolo di
 * sistema una sola volta (v. prisma/seed.ts): senza questa sincronizzazione,
 * un nuovo modulo aggiunto al catalogo (come "kpi" in questo incremento)
 * resterebbe silenziosamente invisibile su ogni installazione già seminata
 * in un incremento precedente.
 */
export async function sincronizzaPermessiCatalogo(ruoloId: string): Promise<number> {
  const permessiEsistenti = await db.permesso.findMany({ where: { ruoloId } });
  const chiaviEsistenti = new Set(permessiEsistenti.map((p) => `${p.modulo}:${p.azione}`));

  let aggiunti = 0;
  for (const [modulo, azioni] of Object.entries(CATALOGO_MODULI_AZIONI)) {
    for (const azione of azioni) {
      if (!chiaviEsistenti.has(`${modulo}:${azione}`)) {
        await assegnaPermesso(ruoloId, modulo, azione);
        aggiunti++;
      }
    }
  }
  return aggiunti;
}
