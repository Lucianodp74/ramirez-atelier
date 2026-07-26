import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatta una dimensione in byte in una stringa leggibile (KB/MB). */
export function formattaDimensione(byte: number): string {
  if (byte < 1024) return `${byte} B`;
  if (byte < 1024 * 1024) return `${(byte / 1024).toFixed(1)} KB`;
  return `${(byte / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Divide euristicamente un nome completo in nome/cognome, sulla prima
 * parola come nome, il resto come cognome - non un parser di nomi vero
 * (casi come "Maria Grazia Rossi" si dividono in modo imperfetto, per
 * scelta esplicita: correggibile a mano dal pannello Clienti, non vale la
 * pena costruire una logica più sofisticata per questo). Se non c'è
 * nessuno spazio, il nome resta intero e il cognome è null.
 */
export function dividiNomeCompleto(nomeCompleto: string): { nome: string; cognome: string | null } {
  const pulito = nomeCompleto.trim();
  const primoSpazio = pulito.indexOf(' ');
  if (primoSpazio === -1) return { nome: pulito, cognome: null };
  return {
    nome: pulito.slice(0, primoSpazio).trim(),
    cognome: pulito.slice(primoSpazio + 1).trim() || null,
  };
}

/** Compone nome e cognome per la visualizzazione - mai concatenati altrove
 * nel codice, per avere un solo posto che decide come si presentano insieme. */
export function nomeCompletoCliente(cliente: { nome: string; cognome?: string | null }): string {
  return cliente.cognome ? `${cliente.nome} ${cliente.cognome}` : cliente.nome;
}
