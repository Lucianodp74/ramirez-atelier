'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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
  redirect(`/admin/commesse/${id}`);
}

export async function cambiaStatoCommessaAzione(id: string, stato: StatoCommessa): Promise<void> {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
  await cambiaStatoCommessa(contesto.tenantId, id, stato);
  revalidatePath('/admin/commesse');
  revalidatePath(`/admin/commesse/${id}`);
}
