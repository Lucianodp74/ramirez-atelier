import { db } from '@/server/db';

/**
 * VerificatorePermesso (ADR-0004 §6, Principio 2 e 5): interroga sempre i
 * Permesso effettivamente assegnati ai Ruolo di una Membership - MAI una
 * condizione tipo `if (ruolo === 'Proprietario')`. Aggiungere un nuovo ruolo o
 * un nuovo permesso è un'operazione sui dati (tabella `ruolo`/`permesso`), mai
 * una modifica di questo file.
 */
export async function haPermesso(
  membershipId: string,
  modulo: string,
  azione: string,
): Promise<boolean> {
  const assegnazioni = await db.membershipRuolo.findMany({ where: { membershipId } });
  if (assegnazioni.length === 0) return false;

  const ruoloIds = assegnazioni.map((a) => a.ruoloId);
  const permessi = await db.permesso.findMany({
    where: { ruoloId: { in: ruoloIds }, modulo, azione },
  });

  return permessi.length > 0;
}

/** Elenco leggibile dei permessi risolti per una Membership (utile per la UI e per debug). */
export async function permessiRisolti(
  membershipId: string,
): Promise<Array<{ modulo: string; azione: string }>> {
  const assegnazioni = await db.membershipRuolo.findMany({ where: { membershipId } });
  const ruoloIds = assegnazioni.map((a) => a.ruoloId);
  if (ruoloIds.length === 0) return [];

  const permessi = await db.permesso.findMany({ where: { ruoloId: { in: ruoloIds } } });
  const mappa = new Map(
    permessi.map((p) => [`${p.modulo}:${p.azione}`, { modulo: p.modulo, azione: p.azione }]),
  );
  return [...mappa.values()];
}
