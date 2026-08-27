'use server';

import { revalidatePath } from 'next/cache';
import { richiediContesto } from '@/server/identity/contesto';
import {
  creaPrezzoListino,
  aggiornaPrezzoListino,
  impostaAttivoPrezzoListino,
  type TipoListino,
} from '@/server/services/listino-prezzi-service';

function numeroOpzionale(formData: FormData, nome: string) {
  const valore = String(formData.get(nome) ?? '').trim();
  if (!valore) return null;
  const numero = Number(valore);
  if (!Number.isFinite(numero) || numero < 0) throw new Error(`${nome} non valido.`);
  return numero;
}

function tipoValido(valore: string): TipoListino {
  if (valore === 'MATERIALE' || valore === 'COMPONENTE' || valore === 'COMPOSIZIONE') return valore;
  throw new Error('Tipo listino non valido.');
}

export async function creaPrezzoListinoAzione(formData: FormData) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const tipo = tipoValido(String(formData.get('tipo') ?? 'COMPONENTE'));
  const categoria = String(formData.get('categoria') ?? '').trim();
  const codice = String(formData.get('codice') ?? '').trim();
  const nome = String(formData.get('nome') ?? '').trim();
  const unita = String(formData.get('unita') ?? '').trim();
  const prezzo = Number(formData.get('prezzo'));
  const descrizione = String(formData.get('descrizione') ?? '').trim();
  const materiale = String(formData.get('materiale') ?? '').trim();
  if (!categoria || !codice || !nome || !unita || !Number.isFinite(prezzo) || prezzo < 0) {
    throw new Error('Compila tipo, categoria, codice, nome, unità e prezzo valido.');
  }
  await creaPrezzoListino(contesto.tenantId, {
    tipo,
    categoria,
    codice,
    nome,
    unita,
    prezzo,
    descrizione: descrizione || null,
    materiale: materiale || null,
    larghezzaCm: numeroOpzionale(formData, 'larghezzaCm'),
    altezzaCm: numeroOpzionale(formData, 'altezzaCm'),
    profonditaCm: numeroOpzionale(formData, 'profonditaCm'),
  });
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
