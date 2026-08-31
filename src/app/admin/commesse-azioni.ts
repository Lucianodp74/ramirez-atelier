'use server';

import { revalidatePath } from 'next/cache';
import { richiediContesto } from '@/server/identity/contesto';
import {
  aggiornaDatiOperativiCommessa,
  cambiaStatoCommessa,
  creaCommessaDaRichiesta,
  type StatoCommessa,
} from '@/server/services/commessa-service';

export async function creaCommessaDaRichiestaAzione(
  richiestaId: string,
): Promise<{ successo: true; id: string } | { successo: false; errore: string }> {
  try {
    const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
    const id = await creaCommessaDaRichiesta(contesto.tenantId, richiestaId);

    // La mutation è conclusa atomicamente. Il client esegue una navigazione
    // browser completa verso /admin/commesse, quindi non serve invalidare la
    // cache della route durante la Server Action.
    return { successo: true, id };
  } catch (error) {
    // Evitiamo che un errore della mutation diventi un generico RSC 500.
    // Il messaggio viene mostrato solo nell'area admin per rendere diagnosticabile
    // un eventuale problema di database/configurazione in produzione.
    console.error('creaCommessaDaRichiestaAzione fallita', { richiestaId, error });
    return {
      successo: false,
      errore: error instanceof Error ? error.message : 'Impossibile creare la commessa.',
    };
  }
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
