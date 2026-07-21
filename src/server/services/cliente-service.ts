import { db } from '@/server/db';
import type { ClienteTipo } from '@prisma/client';

export interface DatiContattoCliente {
  nome: string;
  email?: string | null;
  telefono?: string | null;
  tipo?: ClienteTipo;
  azienda?: string | null;
}

/**
 * Trova un Cliente esistente o ne crea uno nuovo, deterministicamente: prima
 * per email (se presente), poi per telefono (se presente). Mai un abbinamento
 * sul nome - due persone omonime restano due Clienti distinti, un errore di
 * battitura nel nome non fonde per sbaglio due persone diverse (principio
 * confermato esplicitamente: meglio due clienti distinti che una fusione
 * automatica sbagliata).
 *
 * Chiamata solo al completamento di una richiesta (v. azioni.ts), non ad ogni
 * passo del wizard - un Cliente ha valore reale solo quando la richiesta è
 * davvero inviata, non per ogni bozza abbandonata (Configurazione a Valore).
 */
export async function trovaOCreaCliente(tenantId: string, dati: DatiContattoCliente) {
  if (dati.email) {
    const perEmail = await db.cliente.findMany({ where: { tenantId, email: dati.email } });
    if (perEmail.length > 0) return perEmail[0];
  } else if (dati.telefono) {
    const perTelefono = await db.cliente.findMany({ where: { tenantId, telefono: dati.telefono } });
    if (perTelefono.length > 0) return perTelefono[0];
  }

  return db.cliente.create({
    data: {
      tenantId,
      nome: dati.nome,
      email: dati.email ?? null,
      telefono: dati.telefono ?? null,
      tipo: dati.tipo ?? 'PRIVATO',
      azienda: dati.azienda ?? null,
    },
  });
}

export interface FiltriElencoClienti {
  ricerca?: string;
}

/** Ricerca su nome, email E telefono - la lacuna che rompeva la chiamata del
 * cliente delle 11:15 nella simulazione: prima la ricerca in admin copriva
 * solo nome/email. */
export async function elencoClienti(tenantId: string, filtri: FiltriElencoClienti = {}) {
  const where: Record<string, unknown> = { tenantId };
  if (filtri.ricerca) {
    where.OR = [
      { nome: { contains: filtri.ricerca, mode: 'insensitive' } },
      { email: { contains: filtri.ricerca, mode: 'insensitive' } },
      { telefono: { contains: filtri.ricerca, mode: 'insensitive' } },
    ];
  }
  return db.cliente.findMany({ where, orderBy: { nome: 'asc' } });
}

/**
 * Il centro dell'interfaccia cliente: non un'anagrafica, ma le sue richieste
 * e la cronologia aggregata di TUTTI gli eventi attraverso quelle richieste,
 * in ordine cronologico - riusa EventoAttivita già esistente (costruito per
 * la cronologia di una singola richiesta), esteso qui a più richieste dello
 * stesso cliente. Nessuna nuova infrastruttura di eventi.
 */
export async function dettaglioCliente(tenantId: string, clienteId: string) {
  const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente || cliente.tenantId !== tenantId) return null;

  const richieste = await db.richiestaProgetto.findMany({
    where: { tenantId, clienteId },
    orderBy: { createdAt: 'desc' },
  });

  const tipiProgetto = await db.tipoProgetto.findMany({ where: { tenantId } });
  const richiesteConTipo = richieste.map((r) => ({
    ...r,
    tipoProgetto: tipiProgetto.find((t) => t.id === r.tipoProgettoId) ?? null,
  }));

  const idRichieste = richieste.map((r) => r.id);
  const eventi =
    idRichieste.length > 0
      ? await db.eventoAttivita.findMany({ where: { richiestaId: { in: idRichieste } } })
      : [];
  // Più recente per primo, coerente con "cronologia del rapporto" come centro
  // dell'interfaccia (l'ultimo contatto è la prima cosa che il titolare vuole vedere).
  eventi.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const ultimoContatto = eventi[0]?.createdAt ?? null;

  return { cliente, richieste: richiesteConTipo, eventi, ultimoContatto };
}

export async function aggiornaNoteCliente(tenantId: string, clienteId: string, note: string) {
  const cliente = await db.cliente.findUnique({ where: { id: clienteId } });
  if (!cliente || cliente.tenantId !== tenantId) throw new Error('Cliente non trovato.');
  return db.cliente.update({ where: { id: clienteId }, data: { note } });
}
