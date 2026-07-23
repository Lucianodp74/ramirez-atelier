import { db } from '@/server/db';

export async function elencoRegole(tenantId: string) {
  return db.regola.findMany({ where: { tenantId }, orderBy: { priorita: 'desc' } });
}

export async function impostaStatoRegola(
  tenantId: string,
  id: string,
  stato: 'ATTIVA' | 'DISATTIVA',
) {
  const regola = await db.regola.findUnique({ where: { id } });
  if (!regola || regola.tenantId !== tenantId) throw new Error('Regola non trovata.');
  return db.regola.update({ where: { id }, data: { stato } });
}

/** Cronologia esecuzioni per una specifica entità (usato nella pagina di dettaglio richiesta). */
export async function esecuzioniPerEntita(entitaTipo: string, entitaId: string) {
  const esecuzioni = await db.esecuzioneRegola.findMany({
    where: { entitaTipo, entitaId },
    orderBy: { createdAt: 'desc' },
  });

  const regoleUniche = await Promise.all(
    [...new Set(esecuzioni.map((e) => e.regolaId))].map((id) =>
      db.regola.findUnique({ where: { id } }),
    ),
  );
  const mappaRegole = new Map(regoleUniche.filter(Boolean).map((r) => [r!.id, r!]));

  return esecuzioni.map((e) => ({ ...e, regola: mappaRegole.get(e.regolaId) }));
}

/** Cronologia esecuzioni globale per Tenant (usata nella pagina di gestione regole). */
export async function ultimeEsecuzioni(tenantId: string, limite = 50) {
  const regoleDelTenant = await db.regola.findMany({ where: { tenantId } });
  const idRegole = new Set(regoleDelTenant.map((r) => r.id));

  const esecuzioni = await db.esecuzioneRegola.findMany({
    orderBy: { createdAt: 'desc' },
    take: limite * 3,
  });
  return esecuzioni.filter((e) => idRegole.has(e.regolaId)).slice(0, limite);
}
