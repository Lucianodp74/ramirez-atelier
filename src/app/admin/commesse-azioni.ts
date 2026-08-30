'use server';

import { revalidatePath } from 'next/cache';
import { richiediContesto } from '@/server/identity/contesto';
import {
  aggiornaDatiOperativiCommessa,
  cambiaStatoCommessa,
  creaCommessaDaRichiesta,
  type StatoCommessa,
} from '@/server/services/commessa-service';

export async function creaCommessaDaRichiestaAzione(richiestaId: string) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
  const id = await creaCommessaDaRichiesta(contesto.tenantId, richiestaId);

  // La creazione è completata atomicamente. Il client esegue una navigazione
  // browser completa verso /admin/commesse, quindi non serve invalidare la cache
  // della route durante la Server Action. Questo evita qualsiasi aggiornamento RSC
  // concorrente mentre la risposta dell'action viene restituita al browser.
  return { id };
}

export async function cambiaStatoCommessaAzione(id: string, stato: StatoCommessa): Promise<void> {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
  await cambiaStatoCommessa(contesto.tenantId, id, stato);
  revalidatePath('/admin/commesse');
  revalidatePath(`/admin/commesse/${id}`);
}

export async function aggiornaDatiOperativiCommessaAzione(
  id: string,
  formData: FormData,
): Promise<void> {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });

  const dataRaw = String(formData.get('dataPrevistaConsegna') ?? '').trim();
  const noteRaw = String(formData.get('noteProduzione') ?? '').trim();

  let dataPrevistaConsegna: Date | null = null;
  if (dataRaw) {
    const data = new Date(`${dataRaw}T12:00:00`);
    if (Number.isNaN(data.getTime())) throw new Error('Data prevista di consegna non valida.');
    dataPrevistaConsegna = data;
  }

  await aggiornaDatiOperativiCommessa(
    contesto.tenantId,
    id,
    dataPrevistaConsegna,
    noteRaw || null,
  );

  revalidatePath('/admin/commesse');
  revalidatePath(`/admin/commesse/${id}`);
}
