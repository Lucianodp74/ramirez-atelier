'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { richiediContesto } from '@/server/identity/contesto';
import {
  cambiaStato as cambiaStatoServizio,
  aggiungiCommento as aggiungiCommentoServizio,
  creaRichiestaDaPuntoDiPartenza,
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
import { getEmailAdapter } from '@/lib/notifiche';
import {
  creaFinitura,
  aggiornaFinitura,
  impostaAttivaFinitura,
  eliminaFinitura,
  type DatiFinitura,
} from '@/server/services/catalogo-service';
import {
  creaFerramenta,
  aggiornaFerramenta,
  impostaAttivaFerramenta,
  eliminaFerramenta,
  type DatiFerramenta,
} from '@/server/services/ferramenta-service';
import {
  creaAccessorio,
  aggiornaAccessorio,
  impostaAttivaAccessorio,
  eliminaAccessorio,
  type DatiAccessorio,
} from '@/server/services/accessorio-service';
import {
  creaVariante,
  aggiornaVariante,
  impostaAttivaVariante,
  eliminaVariante,
  type DatiVariantePreimpostata,
} from '@/server/services/variante-preimpostata-service';
import { aggiornaNoteCliente } from '@/server/services/cliente-service';
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
  const link = `${process.env.SITE_URL}/invito/${tokenGrezzo}`;
  await getEmailAdapter().invia({
    destinatario: email,
    oggetto: 'Sei stato invitato su Ramirez Atelier',
    corpo: `Sei stato invitato a collaborare su Ramirez Atelier, con il ruolo di ${ruoloNome}.\n\nApri questo link per accettare l'invito:\n${link}`,
  });
  // Il link resta comunque visibile in interfaccia (v. FormInvitaUtente.tsx):
  // finché l'adattatore email è quello console, è l'unico modo pratico di
  // recuperarlo senza andare a leggere i log del server.
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

export async function creaFinituraAzione(dati: DatiFinitura) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const finitura = await creaFinitura(contesto.tenantId, dati);
  revalidatePath('/admin/catalogo/finiture');
  return finitura;
}

export async function aggiornaFinituraAzione(id: string, dati: Partial<DatiFinitura>) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const finitura = await aggiornaFinitura(contesto.tenantId, id, dati);
  revalidatePath('/admin/catalogo/finiture');
  return finitura;
}

export async function impostaAttivaFinituraAzione(id: string, attiva: boolean) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  await impostaAttivaFinitura(contesto.tenantId, id, attiva);
  revalidatePath('/admin/catalogo/finiture');
}

/** Restituisce un messaggio d'errore leggibile invece di lanciare un'eccezione
 * non gestita, così il componente client può mostrarlo senza un try/catch
 * sparso in ogni bottone - unico punto che traduce l'eccezione del servizio
 * in un risultato che l'interfaccia sa presentare. */
export async function eliminaFinituraAzione(
  id: string,
): Promise<{ successo: boolean; errore?: string }> {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  try {
    await eliminaFinitura(contesto.tenantId, id);
    revalidatePath('/admin/catalogo/finiture');
    return { successo: true };
  } catch (e) {
    return { successo: false, errore: e instanceof Error ? e.message : 'Errore sconosciuto.' };
  }
}

export async function creaFerramentaAzione(dati: DatiFerramenta) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const riga = await creaFerramenta(contesto.tenantId, dati);
  revalidatePath('/admin/catalogo/ferramenta');
  return riga;
}

export async function aggiornaFerramentaAzione(id: string, dati: Partial<DatiFerramenta>) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const riga = await aggiornaFerramenta(contesto.tenantId, id, dati);
  revalidatePath('/admin/catalogo/ferramenta');
  return riga;
}

export async function impostaAttivaFerramentaAzione(id: string, attiva: boolean) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  await impostaAttivaFerramenta(contesto.tenantId, id, attiva);
  revalidatePath('/admin/catalogo/ferramenta');
}

export async function eliminaFerramentaAzione(
  id: string,
): Promise<{ successo: boolean; errore?: string }> {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  try {
    await eliminaFerramenta(contesto.tenantId, id);
    revalidatePath('/admin/catalogo/ferramenta');
    return { successo: true };
  } catch (e) {
    return { successo: false, errore: e instanceof Error ? e.message : 'Errore sconosciuto.' };
  }
}

export async function creaAccessorioAzione(dati: DatiAccessorio) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const riga = await creaAccessorio(contesto.tenantId, dati);
  revalidatePath('/admin/catalogo/accessori');
  return riga;
}

export async function aggiornaAccessorioAzione(id: string, dati: Partial<DatiAccessorio>) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const riga = await aggiornaAccessorio(contesto.tenantId, id, dati);
  revalidatePath('/admin/catalogo/accessori');
  return riga;
}

export async function impostaAttivaAccessorioAzione(id: string, attiva: boolean) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  await impostaAttivaAccessorio(contesto.tenantId, id, attiva);
  revalidatePath('/admin/catalogo/accessori');
}

export async function eliminaAccessorioAzione(
  id: string,
): Promise<{ successo: boolean; errore?: string }> {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  try {
    await eliminaAccessorio(contesto.tenantId, id);
    revalidatePath('/admin/catalogo/accessori');
    return { successo: true };
  } catch (e) {
    return { successo: false, errore: e instanceof Error ? e.message : 'Errore sconosciuto.' };
  }
}

export async function creaVarianteAzione(dati: DatiVariantePreimpostata) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const variante = await creaVariante(contesto.tenantId, dati);
  revalidatePath('/admin/catalogo/varianti');
  return variante;
}

export async function aggiornaVarianteAzione(
  id: string,
  dati: Partial<Omit<DatiVariantePreimpostata, 'tipoProgettoId'>>,
) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const variante = await aggiornaVariante(contesto.tenantId, id, dati);
  revalidatePath('/admin/catalogo/varianti');
  return variante;
}

export async function impostaAttivaVarianteAzione(id: string, attiva: boolean) {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  await impostaAttivaVariante(contesto.tenantId, id, attiva);
  revalidatePath('/admin/catalogo/varianti');
}

export async function eliminaVarianteAzione(
  id: string,
): Promise<{ successo: boolean; errore?: string }> {
  const contesto = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  try {
    await eliminaVariante(contesto.tenantId, id);
    revalidatePath('/admin/catalogo/varianti');
    return { successo: true };
  } catch (e) {
    return { successo: false, errore: e instanceof Error ? e.message : 'Errore sconosciuto.' };
  }
}

export async function aggiornaNoteClienteAzione(clienteId: string, note: string) {
  const contesto = await richiediContesto({ modulo: 'clienti', azione: 'gestisci' });
  await aggiornaNoteCliente(contesto.tenantId, clienteId, note);
  revalidatePath(`/admin/clienti/${clienteId}`);
}

/** "Usa questo preventivo come punto di partenza" - v. richieste-service.ts
 * per il perché del nome e della scelta di riusare il meccanismo di ripresa
 * bozza invece di costruire un editor. */
export async function usaComePuntoDiPartenzaAzione(richiestaOriginaleId: string) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'gestisci' });
  const nuova = await creaRichiestaDaPuntoDiPartenza(contesto.tenantId, richiestaOriginaleId);
  const tipoProgetto = await db.tipoProgetto.findUnique({ where: { id: nuova.tipoProgettoId } });
  return { tokenRipresa: nuova.tokenRipresa, chiaveTipoProgetto: tipoProgetto?.chiave ?? '' };
}
