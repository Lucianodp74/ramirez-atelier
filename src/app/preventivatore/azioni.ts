'use server';

import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { caricaTariffePreventivatore } from '@/server/services/preventivatore-listino-service';
import { calcolaPreventivoModulare } from '@/lib/preventivatore/prezzo-modulare';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';

function isModuloConfigurato(value: unknown): value is ModuloConfigurato {
  if (!value || typeof value !== 'object') return false;

  const modulo = value as Record<string, unknown>;
  const dimensioni = modulo.dimensioni;

  if (!dimensioni || typeof dimensioni !== 'object') return false;
  const dims = dimensioni as Record<string, unknown>;

  return (
    typeof modulo.id === 'string' &&
    typeof modulo.tipo === 'string' &&
    typeof modulo.materiale === 'string' &&
    typeof modulo.finitura === 'string' &&
    typeof modulo.configurazione === 'string' &&
    typeof dims.larghezzaCm === 'number' &&
    typeof dims.altezzaCm === 'number' &&
    typeof dims.profonditaCm === 'number' &&
    (modulo.ripiani === undefined || typeof modulo.ripiani === 'number')
  );
}

function validaInputModuli(moduli: unknown): asserts moduli is ModuloConfigurato[] {
  if (!Array.isArray(moduli) || !moduli.every(isModuloConfigurato)) {
    throw new Error('Configurazione preventivatore non valida.');
  }
}

/**
 * Punto unico di calcolo per il client: il browser invia solo la configurazione,
 * mentre listino, costi e ricarico vengono letti e applicati esclusivamente sul server.
 */
export async function calcolaStimaPreventivatore(moduli: unknown) {
  validaInputModuli(moduli);

  if (moduli.length === 0) {
    return { successo: true as const, preventivo: { righe: [], costoProduzione: 0, prezzoIndicativo: 0, errori: [] } };
  }

  const tenantId = await idTenantRamirezAtelier();
  const tariffe = await caricaTariffePreventivatore(tenantId);
  const preventivo = calcolaPreventivoModulare(moduli, tariffe);

  return { successo: true as const, preventivo };
}
