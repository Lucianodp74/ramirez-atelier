'use server';

import { revalidatePath } from 'next/cache';
import { richiediContesto } from '@/server/identity/contesto';
import {
  cambiaStatoCommessa,
  creaCommessaDaRichiesta,
  type StatoCommessa,
} from '@/server/services/commessa-service';

export async function creaCommessaDaRichiestaAzione(richiestaId: string) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
  const id = await creaCommessaDaRichiesta(contesto.tenantId, richiestaId);
  revalidatePath('/admin/commesse');
  revalidatePath(`/admin/richieste/${richiestaId}`);
  return { id };
}

export async function cambiaStatoCommessaAzione(id: string, stato: StatoCommessa) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
  const commessa = await cambiaStatoCommessa(contesto.tenantId, id, stato);
  revalidatePath('/admin/commesse');
  revalidatePath(`/admin/commesse/${id}`);
  return commessa;
}
