'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/server/db';
import { richiediContesto } from '@/server/identity/contesto';
import { cambiaStato as cambiaStatoServizio, aggiungiCommento as aggiungiCommentoServizio, creaRichiestaDaPuntoDiPartenza } from '@/server/services/richieste-service';
import { creaFasciaBudget, aggiornaFasciaBudget, impostaAttivaFasciaBudget, type DatiFasciaBudget } from '@/server/services/fasce-budget-service';
import { impostaStatoRegola } from '@/server/services/regole-service';
import { creaSpesa, aggiornaSpesa, eliminaSpesa } from '@/server/services/spesa-service';
import { membershipDiTenant, sospendiMembership, riattivaMembership, revocaMembership } from '@/server/services/membership-service';
import { elencoRuoli } from '@/server/services/ruolo-service';
import { creaInvito, elencoInviti, revocaInvito } from '@/server/services/invito-service';
import { getEmailAdapter } from '@/lib/notifiche';
import { creaFinitura, aggiornaFinitura, impostaAttivaFinitura, eliminaFinitura, type DatiFinitura } from '@/server/services/catalogo-service';
import { creaFerramenta, aggiornaFerramenta, impostaAttivaFerramenta, eliminaFerramenta, type DatiFerramenta } from '@/server/services/ferramenta-service';
import { creaAccessorio, aggiornaAccessorio, impostaAttivaAccessorio, eliminaAccessorio, type DatiAccessorio } from '@/server/services/accessorio-service';
import { creaVariante, aggiornaVariante, impostaAttivaVariante, eliminaVariante, type DatiVariantePreimpostata } from '@/server/services/variante-preimpostata-service';
import { aggiornaNoteCliente, aggiornaCliente, type DatiModificaCliente } from '@/server/services/cliente-service';
import { creaPrezzoListino, aggiornaPrezzoListino, impostaAttivoPrezzoListino } from '@/server/services/listino-prezzi-service';
import type { StatoRichiesta } from '@prisma/client';

export async function cambiaStatoRichiesta(id: string, nuovoStato: StatoRichiesta) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
  const esito = await cambiaStatoServizio(contesto.tenantId, id, nuovoStato);
  if (esito.successo) { revalidatePath(`/admin/richieste/${id}`); revalidatePath('/admin/richieste'); revalidatePath('/admin'); }
  return esito;
}

export async function aggiungiCommentoRichiesta(id: string, testo: string) {
  const contesto = await richiediContesto({ modulo: 'richieste', azione: 'commenta' });
  const commento = await aggiungiCommentoServizio(contesto.tenantId, id, testo, contesto.utenteNome);
  revalidatePath(`/admin/richieste/${id}`); return commento;
}

export async function creaFasciaBudgetAzione(dati: DatiFasciaBudget) { const c = await richiediContesto({ modulo: 'fasce_budget', azione: 'gestisci' }); await creaFasciaBudget(c.tenantId, dati); revalidatePath('/admin/fasce-budget'); }
export async function aggiornaFasciaBudgetAzione(id: string, dati: Partial<DatiFasciaBudget>) { const c = await richiediContesto({ modulo: 'fasce_budget', azione: 'gestisci' }); await aggiornaFasciaBudget(c.tenantId, id, dati); revalidatePath('/admin/fasce-budget'); }
export async function impostaAttivaFasciaBudgetAzione(id: string, attiva: boolean) { const c = await richiediContesto({ modulo: 'fasce_budget', azione: 'gestisci' }); await impostaAttivaFasciaBudget(c.tenantId, id, attiva); revalidatePath('/admin/fasce-budget'); }
export async function creaSpesaAzione(nome: string, importoMensile: number) { const c = await richiediContesto({ modulo: 'spese', azione: 'gestisci' }); await creaSpesa(c.tenantId, nome, importoMensile); revalidatePath('/admin/spese'); }
export async function aggiornaSpesaAzione(id: string, nome: string, importoMensile: number) { const c = await richiediContesto({ modulo: 'spese', azione: 'gestisci' }); await aggiornaSpesa(c.tenantId, id, nome, importoMensile); revalidatePath('/admin/spese'); }
export async function eliminaSpesaAzione(id: string) { const c = await richiediContesto({ modulo: 'spese', azione: 'gestisci' }); await eliminaSpesa(c.tenantId, id); revalidatePath('/admin/spese'); }
export async function impostaStatoRegolaAzione(id: string, stato: 'ATTIVA' | 'DISATTIVA') { const c = await richiediContesto({ modulo: 'regole', azione: 'gestisci' }); await impostaStatoRegola(c.tenantId, id, stato); revalidatePath('/admin/regole'); }

export async function elencoUtentiTenant() { const c = await richiediContesto({ modulo: 'utenti', azione: 'leggi' }); const [membership, inviti, ruoli] = await Promise.all([membershipDiTenant(c.tenantId), elencoInviti(c.tenantId), elencoRuoli(c.tenantId)]); return { membership, inviti, ruoli }; }
export async function invitaUtenteAzione(email: string, ruoloNome: string) { const c = await richiediContesto({ modulo: 'utenti', azione: 'gestisci' }); const { tokenGrezzo } = await creaInvito(c.tenantId, email, ruoloNome, c.utenteId); revalidatePath('/admin/utenti'); const link = `${process.env.SITE_URL}/invito/${tokenGrezzo}`; await getEmailAdapter().invia({ destinatario: email, oggetto: 'Sei stato invitato su Ramirez Atelier', corpo: `Sei stato invitato a collaborare su Ramirez Atelier, con il ruolo di ${ruoloNome}.\n\nApri questo link per accettare l'invito:\n${link}` }); return { linkInvito: `/invito/${tokenGrezzo}` }; }
export async function sospendiMembershipAzione(id: string) { await richiediContesto({ modulo: 'utenti', azione: 'gestisci' }); await sospendiMembership(id); revalidatePath('/admin/utenti'); }
export async function riattivaMembershipAzione(id: string) { await richiediContesto({ modulo: 'utenti', azione: 'gestisci' }); await riattivaMembership(id); revalidatePath('/admin/utenti'); }
export async function revocaMembershipAzione(id: string) { await richiediContesto({ modulo: 'utenti', azione: 'gestisci' }); await revocaMembership(id); revalidatePath('/admin/utenti'); }
export async function revocaInvitoAzione(id: string) { const c = await richiediContesto({ modulo: 'utenti', azione: 'gestisci' }); await revocaInvito(c.tenantId, id); revalidatePath('/admin/utenti'); }

export async function creaFinituraAzione(dati: DatiFinitura) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); const r = await creaFinitura(c.tenantId, dati); revalidatePath('/admin/catalogo/finiture'); return r; }
export async function aggiornaFinituraAzione(id: string, dati: Partial<DatiFinitura>) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); const r = await aggiornaFinitura(c.tenantId, id, dati); revalidatePath('/admin/catalogo/finiture'); return r; }
export async function impostaAttivaFinituraAzione(id: string, attiva: boolean) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); await impostaAttivaFinitura(c.tenantId, id, attiva); revalidatePath('/admin/catalogo/finiture'); }
export async function eliminaFinituraAzione(id: string): Promise<{ successo: boolean; errore?: string }> { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); try { await eliminaFinitura(c.tenantId, id); revalidatePath('/admin/catalogo/finiture'); return { successo: true }; } catch (e) { return { successo: false, errore: e instanceof Error ? e.message : 'Errore sconosciuto.' }; } }
export async function creaFerramentaAzione(dati: DatiFerramenta) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); const r = await creaFerramenta(c.tenantId, dati); revalidatePath('/admin/catalogo/ferramenta'); return r; }
export async function aggiornaFerramentaAzione(id: string, dati: Partial<DatiFerramenta>) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); const r = await aggiornaFerramenta(c.tenantId, id, dati); revalidatePath('/admin/catalogo/ferramenta'); return r; }
export async function impostaAttivaFerramentaAzione(id: string, attiva: boolean) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); await impostaAttivaFerramenta(c.tenantId, id, attiva); revalidatePath('/admin/catalogo/ferramenta'); }
export async function eliminaFerramentaAzione(id: string): Promise<{ successo: boolean; errore?: string }> { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); try { await eliminaFerramenta(c.tenantId, id); revalidatePath('/admin/catalogo/ferramenta'); return { successo: true }; } catch (e) { return { successo: false, errore: e instanceof Error ? e.message : 'Errore sconosciuto.' }; } }
export async function creaAccessorioAzione(dati: DatiAccessorio) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); const r = await creaAccessorio(c.tenantId, dati); revalidatePath('/admin/catalogo/accessori'); return r; }
export async function aggiornaAccessorioAzione(id: string, dati: Partial<DatiAccessorio>) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); const r = await aggiornaAccessorio(c.tenantId, id, dati); revalidatePath('/admin/catalogo/accessori'); return r; }
export async function impostaAttivaAccessorioAzione(id: string, attiva: boolean) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); await impostaAttivaAccessorio(c.tenantId, id, attiva); revalidatePath('/admin/catalogo/accessori'); }
export async function eliminaAccessorioAzione(id: string): Promise<{ successo: boolean; errore?: string }> { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); try { await eliminaAccessorio(c.tenantId, id); revalidatePath('/admin/catalogo/accessori'); return { successo: true }; } catch (e) { return { successo: false, errore: e instanceof Error ? e.message : 'Errore sconosciuto.' }; } }
export async function creaVarianteAzione(dati: DatiVariantePreimpostata) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); const r = await creaVariante(c.tenantId, dati); revalidatePath('/admin/catalogo/varianti'); return r; }
export async function aggiornaVarianteAzione(id: string, dati: Partial<Omit<DatiVariantePreimpostata, 'tipoProgettoId'>>) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); const r = await aggiornaVariante(c.tenantId, id, dati); revalidatePath('/admin/catalogo/varianti'); return r; }
export async function impostaAttivaVarianteAzione(id: string, attiva: boolean) { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); await impostaAttivaVariante(c.tenantId, id, attiva); revalidatePath('/admin/catalogo/varianti'); }
export async function eliminaVarianteAzione(id: string): Promise<{ successo: boolean; errore?: string }> { const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' }); try { await eliminaVariante(c.tenantId, id); revalidatePath('/admin/catalogo/varianti'); return { successo: true }; } catch (e) { return { successo: false, errore: e instanceof Error ? e.message : 'Errore sconosciuto.' }; } }
export async function aggiornaNoteClienteAzione(clienteId: string, note: string) { const c = await richiediContesto({ modulo: 'clienti', azione: 'gestisci' }); await aggiornaNoteCliente(c.tenantId, clienteId, note); revalidatePath(`/admin/clienti/${clienteId}`); }
export async function aggiornaClienteAzione(clienteId: string, dati: DatiModificaCliente) { const c = await richiediContesto({ modulo: 'clienti', azione: 'gestisci' }); await aggiornaCliente(c.tenantId, clienteId, dati); revalidatePath(`/admin/clienti/${clienteId}`); revalidatePath('/admin/clienti'); }

export async function creaPrezzoListinoAzione(formData: FormData) {
  const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const categoria = String(formData.get('categoria') ?? '').trim();
  const codice = String(formData.get('codice') ?? '').trim();
  const nome = String(formData.get('nome') ?? '').trim();
  const unita = String(formData.get('unita') ?? '').trim();
  const prezzo = Number(formData.get('prezzo'));
  const descrizione = String(formData.get('descrizione') ?? '').trim();
  if (!categoria || !codice || !nome || !unita || !Number.isFinite(prezzo) || prezzo < 0) throw new Error('Compila categoria, codice, nome, unità e prezzo valido.');
  await creaPrezzoListino(c.tenantId, { categoria, codice, nome, unita, prezzo, descrizione: descrizione || null });
  revalidatePath('/admin/catalogo/listino');
}

export async function aggiornaPrezzoListinoAzione(formData: FormData) {
  const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  const id = String(formData.get('id') ?? '');
  const prezzo = Number(formData.get('prezzo'));
  const motivo = String(formData.get('motivo') ?? '').trim();
  if (!id || !Number.isFinite(prezzo) || prezzo < 0) throw new Error('Prezzo non valido.');
  await aggiornaPrezzoListino(c.tenantId, id, { prezzo }, motivo || undefined);
  revalidatePath('/admin/catalogo/listino');
}

export async function impostaAttivoPrezzoListinoAzione(id: string, attivo: boolean) {
  const c = await richiediContesto({ modulo: 'catalogo', azione: 'gestisci' });
  await impostaAttivoPrezzoListino(c.tenantId, id, attivo);
  revalidatePath('/admin/catalogo/listino');
}

export async function usaComePuntoDiPartenzaAzione(richiestaOriginaleId: string) {
  const c = await richiediContesto({ modulo: 'richieste', azione: 'gestisci' });
  const nuova = await creaRichiestaDaPuntoDiPartenza(c.tenantId, richiestaOriginaleId);
  const tipoProgetto = await db.tipoProgetto.findUnique({ where: { id: nuova.tipoProgettoId } });
  return { tokenRipresa: nuova.tokenRipresa, chiaveTipoProgetto: tipoProgetto?.chiave ?? '' };
}
