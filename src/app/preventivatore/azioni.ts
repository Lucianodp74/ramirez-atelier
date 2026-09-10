'use server';

import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { caricaTariffePreventivatore } from '@/server/services/preventivatore-listino-service';
import { calcolaPreventivoModulare } from '@/lib/preventivatore/prezzo-modulare';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';

/**
 * Punto unico di calcolo per il client: il browser invia solo la configurazione,
 * mentre listino, costi e ricarico vengono letti e applicati esclusivamente sul server.
 */
export async function calcolaStimaPreventivatore(moduli: ModuloConfigurato[]) {
  if (!Array.isArray(moduli) || moduli.length === 0) {
    return { successo: true as const, preventivo: { righe: [], costoProduzione: 0, prezzoIndicativo: 0, errori: [] } };
  }

  const tenantId = await idTenantRamirezAtelier();
  const tariffe = await caricaTariffePreventivatore(tenantId);
  const preventivo = calcolaPreventivoModulare(moduli, tariffe);

  return { successo: true as const, preventivo };
}
