'use server';

import { revalidatePath } from 'next/cache';
import { richiediContesto } from '@/server/identity/contesto';
import {
  aggiornaDatiOperativiCommessa,
  aggiornaStatoRigaProduzione,
  cambiaStatoCommessa,
  creaCommessaDaRichiesta,
  type StatoLavorazioneRiga,
  type StatoCommessa,
} from '@/server/services/commessa-service';

export async function creaCommessaDaRichiestaAzione(
  richiestaId: string,
): Promise<{ successo: true; id: string } | { successo: false; errore: string }> {
  try {
    const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
    const id = await creaCommessaDaRichiesta(contesto.tenantId, richiestaId);
    return { successo: true, id };
  } catch (error) {
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
  revalidatePath('/admin/commesse/produzione');
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

  await aggiornaDatiOperativiCommessa(contesto.tenantId, id, dataPrevistaConsegna, noteRaw || null);
  revalidatePath('/admin/commesse');
  revalidatePath('/admin/commesse/produzione');
  revalidatePath(`/admin/commesse/${id}`);
}

export async function aggiornaStatoRigaProduzioneAzione(
  commessaId: string,
  rigaId: string,
  statoLavorazione: StatoLavorazioneRiga,
): Promise<void> {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
  await aggiornaStatoRigaProduzione(contesto.tenantId, commessaId, rigaId, statoLavorazione);
  revalidatePath('/admin/commesse/produzione');
  revalidatePath(`/admin/commesse/${commessaId}`);
}
