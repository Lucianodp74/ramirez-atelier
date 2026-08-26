'use server';

import { revalidatePath } from 'next/cache';
import { richiediContesto } from '@/server/identity/contesto';
import {
  creaPrezzoListino,
  aggiornaPrezzoListino,
  impostaAttivoPrezzoListino,
} from '@/server/services/listino-prezzi-service';

export async function creaPrezzoListinoAzione(formData: FormData) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const categoria = String(formData.get('categoria') ?? '').trim();
  const codice = String(formData.get('codice') ?? '').trim();
  const nome = String(formData.get('nome') ?? '').trim();
  const unita = String(formData.get('unita') ?? '').trim();
  const prezzo = Number(formData.get('prezzo'));
  const descrizione = String(formData.get('descrizione') ?? '').trim();
  if (!categoria || !codice || !nome || !unita || !Number.isFinite(prezzo) || prezzo < 0) {
    throw new Error('Compila categoria, codice, nome, unità e prezzo valido.');
  }
  await creaPrezzoListino(contesto.tenantId, { categoria, codice, nome, unita, prezzo, descrizione: descrizione || null });
  revalidatePath('/admin/catalogo/listino');
}

export async function aggiornaPrezzoListinoAzione(formData: FormData) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const id = String(formData.get('id') ?? '');
  const prezzo = Number(formData.get('prezzo'));
  const motivo = String(formData.get('motivo') ?? '').trim();
  if (!id || !Number.isFinite(prezzo) || prezzo < 0) throw new Error('Prezzo non valido.');
  await aggiornaPrezzoListino(contesto.tenantId, id, { prezzo }, motivo || undefined);
  revalidatePath('/admin/catalogo/listino');
}

export async function impostaAttivoPrezzoListinoAzione(id: string, attivo: boolean) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  await impostaAttivoPrezzoListino(contesto.tenantId, id, attivo);
  revalidatePath('/admin/catalogo/listino');
}
