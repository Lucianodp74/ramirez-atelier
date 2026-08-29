'use server';

import { revalidatePath } from 'next/cache';
import { richiediContesto } from '@/server/identity/contesto';
import { cambiaStatoBomAdmin, dettaglioBomAdmin } from '@/server/services/bom-admin-service';

export async function confermaBomAzione(bomId: string) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
  const bom = await dettaglioBomAdmin(contesto.tenantId, bomId);

  if (!bom) throw new Error('Distinta non trovata.');
  if (bom.stato !== 'BOZZA') throw new Error('La distinta non è in stato BOZZA.');
  if (bom.righe.length === 0 || bom.righe.some((riga) => riga.costoUnitario == null)) {
    throw new Error('Completa tutti i costi della BOM prima di confermarla.');
  }

  await cambiaStatoBomAdmin(contesto.tenantId, bomId, 'CONFERMATA');
  revalidatePath(`/admin/bom/${bomId}`);
}
