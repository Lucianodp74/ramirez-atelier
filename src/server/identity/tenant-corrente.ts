import { db } from '@/server/db';

const SLUG_TENANT_RAMIREZ = 'ramirez-atelier';

let idTenantCache: string | null = null;

/**
 * Ramirez Atelier è oggi un singolo Tenant. Il wizard pubblico (clienti, non
 * autenticati - IdentitaEsterna resta lavoro futuro, ADR-0004 §8) deve comunque
 * associare ogni RichiestaProgetto a un Tenant esplicito: nessuna riga di
 * business può esistere senza sapere a quale azienda appartiene, anche quando
 * chi la crea non ha fatto login.
 */
export async function idTenantRamirezAtelier(): Promise<string> {
  if (idTenantCache) return idTenantCache;

  const tenant = await db.tenant.findUnique({ where: { slug: SLUG_TENANT_RAMIREZ } });
  if (!tenant) {
    throw new Error(
      `Tenant "${SLUG_TENANT_RAMIREZ}" non trovato: eseguire la migrazione/seed di Identity & Security prima di usare il wizard.`,
    );
  }

  idTenantCache = tenant.id;
  return tenant.id;
}
