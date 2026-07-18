'use server';

import { revalidatePath } from 'next/cache';
import { richiediContesto } from '@/server/identity/contesto';
import {
  cambiaStato as cambiaStatoServizio,
  aggiungiCommento as aggiungiCommentoServizio,
} from '@/server/services/richieste-service';
import {
  creaFasciaBudget,
  aggiornaFasciaBudget,
  impostaAttivaFasciaBudget,
  type DatiFasciaBudget,
} from '@/server/services/fasce-budget-service';
import { impostaStatoRegola } from '@/server/services/regole-service';
import {
  membershipDiTenant,
  sospendiMembership,
  riattivaMembership,
  revocaMembership,
} from '@/server/services/membership-service';
import { elencoRuoli } from '@/server/services/ruolo-service';
import { creaInvito, elencoInviti, revocaInvito } from '@/server/services/invito-service';
import type { StatoRichiesta } from '@prisma/client';

/**
 * Ogni action verifica esplicitamente autenticazione + permesso PRIMA di
 * chiamare il servizio (vincolo esplicito: l'autorizzazione reale è solo lato
 * server, indipendente da cosa mostra o nasconde il frontend). Sono un
 * involucro sottile sul servizio condiviso, usato dalla UI interattiva; la
 * stessa logica è esposta anche via API REST per il riuso esterno - principio
 * API First: nessuna regola di business vive qui, solo la convenienza di poter
 * aggiornare la UI (revalidatePath) dopo l'operazione.
 */
export async function cambiaStatoRichiesta(id: string, nuovoStato: StatoRichiesta) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
  const esito = await cambiaStatoServizio(contesto.tenantId, id, nuovoStato);
  if (esito.successo) {
    revalidatePath(`/admin/richieste/${id}`);
    revalidatePath('/admin/richieste');
    revalidatePath('/admin');
  }
  return esito;
}

export async function aggiungiCommentoRichiesta(id: string, testo: string) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'commenta' });
  const commento = await aggiungiCommentoServizio(
    contesto.tenantId,
    id,
    testo,
    contesto.utenteNome,
  );
  revalidatePath(`/admin/richieste/${id}`);
  return commento;
}

export async function creaFasciaBudgetAzione(dati: DatiFasciaBudget) {
  const contesto = await richiediContesto({ modulo: 'fasce_budget', azione: 'gestisci' });
  const fascia = await creaFasciaBudget(contesto.tenantId, dati);
  revalidatePath('/admin/fasce-budget');
  return fascia;
}

export async function aggiornaFasciaBudgetAzione(id: string, dati: Partial<DatiFasciaBudget>) {
  const contesto = await richiediContesto({ modulo: 'fasce_budget', azione: 'gestisci' });
  const fascia = await aggiornaFasciaBudget(contesto.tenantId, id, dati);
  revalidatePath('/admin/fasce-budget');
  return fascia;
}

export async function impostaAttivaFasciaBudgetAzione(id: string, attiva: boolean) {
  const contesto = await richiediContesto({ modulo: 'fasce_budget', azione: 'gestisci' });
  await impostaAttivaFasciaBudget(contesto.tenantId, id, attiva);
  revalidatePath('/admin/fasce-budget');
}

export async function impostaStatoRegolaAzione(id: string, stato: 'ATTIVA' | 'DISATTIVA') {
  const contesto = await richiediContesto({ modulo: 'regole', azione: 'gestisci' });
  await impostaStatoRegola(contesto.tenantId, id, stato);
  revalidatePath('/admin/regole');
}

export async function elencoUtentiTenant() {
  const contesto = await richiediContesto({ modulo: 'utenti', azione: 'leggi' });
  const [membership, inviti, ruoli] = await Promise.all([
    membershipDiTenant(contesto.tenantId),
    elencoInviti(contesto.tenantId),
    elencoRuoli(contesto.tenantId),
  ]);
  return { membership, inviti, ruoli };
}

export async function invitaUtenteAzione(email: string, ruoloNome: string) {
  const contesto = await richiediContesto({ modulo: 'utenti', azione: 'gestisci' });
  const { tokenGrezzo } = await creaInvito(contesto.tenantId, email, ruoloNome, contesto.utenteId);
  revalidatePath('/admin/utenti');
  // In assenza di un servizio email configurato (v. README), il link va
  // condiviso manualmente con l'invitato in questo incremento.
  return { linkInvito: `/invito/${tokenGrezzo}` };
}

export async function sospendiMembershipAzione(membershipId: string) {
  await richiediContesto({ modulo: 'utenti', azione: 'gestisci' });
  await sospendiMembership(membershipId);
  revalidatePath('/admin/utenti');
}

export async function riattivaMembershipAzione(membershipId: string) {
  await richiediContesto({ modulo: 'utenti', azione: 'gestisci' });
  await riattivaMembership(membershipId);
  revalidatePath('/admin/utenti');
}

export async function revocaMembershipAzione(membershipId: string) {
  await richiediContesto({ modulo: 'utenti', azione: 'gestisci' });
  await revocaMembership(membershipId);
  revalidatePath('/admin/utenti');
}

export async function revocaInvitoAzione(invitoId: string) {
  const contesto = await richiediContesto({ modulo: 'utenti', azione: 'gestisci' });
  await revocaInvito(contesto.tenantId, invitoId);
  revalidatePath('/admin/utenti');
}
