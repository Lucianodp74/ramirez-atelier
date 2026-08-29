'use server';

import { revalidatePath } from 'next/cache';
import { richiediContesto } from '@/server/identity/contesto';
import {
  aggiungiRigaComposizione,
  aggiornaRigaComposizione,
  rimuoviRigaComposizione,
} from '@/server/services/listino-composizioni-service';
import { aggiungiComposizioneABom } from '@/server/services/bom-composizione-service';

function numero(formData: FormData, nome: string) {
  const valore = Number(formData.get(nome));
  if (!Number.isFinite(valore) || valore <= 0) throw new Error(`${nome} non valido.`);
  return valore;
}

export async function aggiungiRigaComposizioneAzione(formData: FormData) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const composizioneId = String(formData.get('composizioneId') ?? '');
  const componenteId = String(formData.get('componenteId') ?? '');
  if (!composizioneId || !componenteId) throw new Error('Seleziona una composizione e un componente.');
  await aggiungiRigaComposizione(contesto.tenantId, composizioneId, componenteId, numero(formData, 'quantita'));
  revalidatePath(`/admin/catalogo/listino/${composizioneId}`);
}

export async function aggiornaRigaComposizioneAzione(formData: FormData) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const id = String(formData.get('id') ?? '');
  const composizioneId = String(formData.get('composizioneId') ?? '');
  if (!id || !composizioneId) throw new Error('Riga non valida.');
  await aggiornaRigaComposizione(contesto.tenantId, id, numero(formData, 'quantita'));
  revalidatePath(`/admin/catalogo/listino/${composizioneId}`);
}

export async function rimuoviRigaComposizioneAzione(formData: FormData) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const id = String(formData.get('id') ?? '');
  const composizioneId = String(formData.get('composizioneId') ?? '');
  if (!id || !composizioneId) throw new Error('Riga non valida.');
  await rimuoviRigaComposizione(contesto.tenantId, id);
  revalidatePath(`/admin/catalogo/listino/${composizioneId}`);
}

type ComposizioneBomActionState = {
  ok: boolean;
  message: string;
  bomId?: string;
};

export async function aggiungiComposizioneABomAzione(
  _previousState: ComposizioneBomActionState,
  formData: FormData,
): Promise<ComposizioneBomActionState> {
  try {
    const contesto = await richiediContesto({ modulo: 'richieste', azione: 'gestisci' });
    const composizioneId = String(formData.get('composizioneId') ?? '');
    const bomId = String(formData.get('bomId') ?? '');
    if (!composizioneId || !bomId) throw new Error('Seleziona una BOM.');

    const risultato = await aggiungiComposizioneABom(contesto.tenantId, bomId, composizioneId);
    revalidatePath(`/admin/catalogo/listino/${composizioneId}`);
    revalidatePath(`/admin/bom/${bomId}`);

    return {
      ok: true,
      bomId,
      message: `${risultato.righeAggiunte} ${risultato.righeAggiunte === 1 ? 'riga aggiunta' : 'righe aggiunte'} alla BOM.`,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Trasferimento non riuscito.',
    };
  }
}
