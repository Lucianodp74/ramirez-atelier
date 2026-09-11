'use server';

import { richiediContesto } from '@/server/identity/contesto';
import { caricaTariffePreventivatore } from '@/server/services/preventivatore-listino-service';
import { calcolaPreventivoModulare } from '@/lib/preventivatore/prezzo-modulare';
import type { ModuloConfigurato } from '@/lib/preventivatore/moduli';

/**
 * Test bench amministrativo: l'autorizzazione viene verificata sul server e il
 * risultato completo resta confinato all'area admin. Il browser pubblico non
 * deve mai ricevere costi di produzione, ore o ricarico.
 */
export async function calcolaTestPreventivatore(modulo: ModuloConfigurato) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'leggi' });
  const tariffe = await caricaTariffePreventivatore(contesto.tenantId);
  const preventivo = calcolaPreventivoModulare([modulo], tariffe);

  if (preventivo.errori.length) {
    throw new Error(preventivo.errori.join(' '));
  }

  const riga = preventivo.righe[0];
  if (!riga) throw new Error('Nessuna riga calcolata.');

  return {
    riga,
    costoProduzione: preventivo.costoProduzione,
    prezzoIndicativo: preventivo.prezzoIndicativo,
    ricaricoPercentuale: tariffe.ricaricoPercentuale,
  };
}
