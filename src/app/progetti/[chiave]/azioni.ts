'use server';

import { cookies } from 'next/headers';
import { db } from '@/server/db';
import { getStorageAdapter, determinaCategoria } from '@/lib/storage';
import { risolviConfigurazioneDinamica } from '@/lib/configurazione-dinamica';
import { datiFormPiatti, costruisciFattiRichiesta } from '@/lib/richiesta-fatti';
import { assicuraGestoriRegistrati } from '@/lib/rule-engine/bootstrap';
import { eseguiRegolePerContesto } from '@/lib/rule-engine/motore';
import { CONTESTO_PRICING } from '@/server/services/pricing-service';
import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';
import { variantiAttivePerTipoProgetto } from '@/server/services/variante-preimpostata-service';
import { trovaOCreaCliente } from '@/server/services/cliente-service';
import { getEmailAdapter } from '@/lib/notifiche';
import {
  TipoProgettoConfigurazioneSchema,
  calcolaIndiceCompletezza,
  validaStep,
  validaConfigurazioneCompleta,
  isCampoRiservato,
} from '@/lib/tipo-progetto-schema';

const PREFISSO_COOKIE = 'ra_bozza_';

/**
 * Recupera la bozza in corso per questo tipo di progetto (dal cookie di ripresa)
 * oppure ne crea una nuova. Nessun login richiesto: il cookie è l'unico stato di
 * sessione (Requisito 1 - salvataggio automatico e ripresa).
 */
export async function iniziaORecuperaBozza(chiaveTipoProgetto: string, tokenEsplicito?: string) {
  const tenantId = await idTenantRamirezAtelier();

  const tipoProgettoGrezzo = await db.tipoProgetto.findUnique({
    where: { tenantId_chiave: { tenantId, chiave: chiaveTipoProgetto } },
  });
  if (!tipoProgettoGrezzo || !tipoProgettoGrezzo.attivo) {
    throw new Error('Tipo di progetto non trovato o non attualmente disponibile.');
  }

  // Le opzioni dinamiche (es. fasce di budget configurabili) vengono risolte qui,
  // una sola volta lato server, così il wizard riceve sempre opzioni pronte -
  // non deve mai sapere che alcune vengono da una tabella invece che dal JSON.
  const configurazioneRisolta = await risolviConfigurazioneDinamica(
    tenantId,
    TipoProgettoConfigurazioneSchema.parse(tipoProgettoGrezzo.configurazione),
  );
  const tipoProgetto = { ...tipoProgettoGrezzo, configurazione: configurazioneRisolta };

  // Stili di partenza (ADR-0006 §3.7) - se non ce n'è nessuno, il wizard salta
  // semplicemente quello step (Progressive Disclosure, mai uno step vuoto).
  const varianti = await variantiAttivePerTipoProgetto(tenantId, tipoProgetto.id);

  const cookieStore = await cookies();
  const nomeCookie = PREFISSO_COOKIE + chiaveTipoProgetto;
  // Il token esplicito (link "usa come punto di partenza" generato dall'admin)
  // ha priorità sul cookie: chi apre quel link potrebbe non essere la stessa
  // persona/browser che ha creato la bozza, quindi il cookie potrebbe non
  // esserci affatto o riferirsi a una bozza diversa.
  const token = tokenEsplicito || cookieStore.get(nomeCookie)?.value;

  if (token) {
    const esistente = await db.richiestaProgetto.findUnique({
      where: { tokenRipresa: token },
      include: { documenti: true },
    });
    if (esistente && esistente.stato === 'BOZZA' && esistente.tipoProgettoId === tipoProgetto.id) {
      // Anche arrivando da un token esplicito, impostiamo il cookie per questo
      // browser - se la pagina viene ricaricata, la ripresa funziona anche
      // senza il parametro nell'URL.
      cookieStore.set(nomeCookie, esistente.tokenRipresa, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 90,
        path: '/',
      });
      return { richiesta: esistente, tipoProgetto, varianti };
    }
  }

  const nuova = await db.richiestaProgetto.create({
    data: { tenantId, tipoProgettoId: tipoProgetto.id },
    include: { documenti: true },
  });

  await db.eventoAttivita.create({
    data: {
      richiestaId: nuova.id,
      tipo: 'RICHIESTA_CREATA',
      descrizione: `Nuova richiesta avviata per "${tipoProgetto.nome}"`,
      attore: 'CLIENTE',
    },
  });

  cookieStore.set(nomeCookie, nuova.tokenRipresa, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 90, // 90 giorni: coerente con un ciclo di decisione lungo (progetti di arredo)
    path: '/',
  });

  return { richiesta: nuova, tipoProgetto, varianti };
}

/**
 * Registra quale Variante Preimpostata il cliente ha scelto come punto di
 * partenza - persiste SUBITO anche i valori (non solo il riferimento
 * variantePreimpostataId), fondendoli nel datiFormJson esistente. Corregge un
 * problema reale trovato in verifica: senza questo, un cliente che sceglie
 * uno stile e chiude il browser prima di attraversare gli step "materiali"/
 * "ferramenta" perderebbe silenziosamente quei valori, nonostante li avesse
 * già scelti - la stessa garanzia di "nessuna perdita di dati" già promessa
 * per ogni altro step del wizard (Requisito 1) si applica anche qui.
 */
export async function registraVarianteSelezionata(richiestaId: string, varianteId: string) {
  const richiesta = await db.richiestaProgetto.findUnique({ where: { id: richiestaId } });
  if (!richiesta) throw new Error('Richiesta non trovata.');

  const variante = await db.variantePreimpostata.findUnique({ where: { id: varianteId } });
  if (!variante) throw new Error('Variante non trovata.');

  const datiEsistenti = (richiesta.datiFormJson as Record<string, unknown>) ?? {};
  const scelte = (variante.scelte as Record<string, string>) ?? {};

  await db.richiestaProgetto.update({
    where: { id: richiestaId },
    data: {
      variantePreimpostataId: varianteId,
      datiFormJson: { ...datiEsistenti, ...scelte },
    },
  });
}

/**
 * Salva le risposte di UNO step. Persiste sempre (mai perdita di dati per errori
 * di validazione — Requisito 1), ma segnala gli errori secondo le regole dichiarate
 * nella configurazione (Requisito 3), così il chiamante decide se permettere di
 * avanzare al passo successivo.
 */
export async function salvaStep(
  richiestaId: string,
  stepChiave: string,
  valori: Record<string, unknown>,
  origine: 'autosave' | 'avanzamento' = 'autosave',
) {
  const richiesta = await db.richiestaProgetto.findUnique({
    where: { id: richiestaId },
    include: { tipoProgetto: true },
  });
  if (!richiesta) throw new Error('Richiesta non trovata.');
  if (!richiesta.tipoProgetto) throw new Error('Tipo di progetto non caricato correttamente.');
  if (richiesta.stato !== 'BOZZA') {
    throw new Error('Questa richiesta è già stata inviata e non può più essere modificata.');
  }

  const configurazione = TipoProgettoConfigurazioneSchema.parse(
    richiesta.tipoProgetto.configurazione,
  );
  const step = configurazione.step.find((s) => s.chiave === stepChiave);
  if (!step) throw new Error(`Lo step "${stepChiave}" non esiste in questa configurazione.`);

  const aggiornamentoColonne: Record<string, unknown> = {};
  const datiFormEsistenti = (richiesta.datiFormJson as Record<string, unknown>) ?? {};
  const nuoviDatiForm = { ...datiFormEsistenti };

  for (const campo of step.campi) {
    if (!(campo.chiave in valori)) continue;
    let valore = valori[campo.chiave];
    if (valore === '') valore = null;
    if (campo.tipo === 'data' && valore) valore = new Date(valore as string);

    if (isCampoRiservato(campo.chiave)) {
      aggiornamentoColonne[campo.chiave] = valore;
    } else {
      nuoviDatiForm[campo.chiave] = valore;
    }
  }

  const datiFormCompleti = {
    ...datiFormPiatti(richiesta),
    ...nuoviDatiForm,
    ...aggiornamentoColonne,
  };
  const erroriStep = validaStep(step, datiFormCompleti);
  const indiceCompletezza = calcolaIndiceCompletezza(configurazione, datiFormCompleti);

  const aggiornata = await db.richiestaProgetto.update({
    where: { id: richiestaId },
    data: {
      ...aggiornamentoColonne,
      datiFormJson: nuoviDatiForm,
      indiceCompletezza,
      ultimoStepChiave: stepChiave,
    },
    include: { documenti: true },
  });

  if (origine === 'avanzamento' && Object.keys(erroriStep).length === 0) {
    await db.eventoAttivita.create({
      data: {
        richiestaId,
        tipo: 'STEP_COMPLETATO',
        descrizione: `Step "${step.titolo}" completato`,
        metadatiJson: { stepChiave },
        attore: 'CLIENTE',
      },
    });
  }

  return { richiesta: aggiornata, errori: erroriStep };
}

/**
 * Carica un documento allegato. Metadati richiesti (Requisito 4): nome originale,
 * tipo MIME, dimensione, data di caricamento (automatica), categoria (derivata dal
 * MIME/estensione, MAI dal contenuto - nessuna analisi del contenuto in questo
 * incremento, v. src/lib/extension-hooks.ts per dove si aggancerà in futuro).
 */
export async function caricaDocumento(richiestaId: string, formData: FormData) {
  const file = formData.get('file');
  if (!(file instanceof File)) throw new Error('Nessun file ricevuto.');

  const richiesta = await db.richiestaProgetto.findUnique({ where: { id: richiestaId } });
  if (!richiesta) throw new Error('Richiesta non trovata.');
  if (richiesta.stato !== 'BOZZA') {
    throw new Error('Questa richiesta è già stata inviata e non accetta più allegati.');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const categoria = determinaCategoria(file.type, file.name);
  const adattatore = getStorageAdapter();
  const { storageObjectKey, dimensioneByte } = await adattatore.carica({
    richiestaId,
    nomeFileOriginale: file.name,
    tipoMime: file.type || 'application/octet-stream',
    contenuto: buffer,
  });

  const documento = await db.documentoRichiesta.create({
    data: {
      richiestaId,
      nomeFileOriginale: file.name,
      tipoMime: file.type || 'application/octet-stream',
      categoria,
      storageObjectKey,
      dimensioneByte,
    },
  });

  await db.eventoAttivita.create({
    data: {
      richiestaId,
      tipo: 'DOCUMENTO_CARICATO',
      descrizione: `Documento "${file.name}" caricato`,
      metadatiJson: { categoria, dimensioneByte },
      attore: 'CLIENTE',
    },
  });

  return documento;
}

/** Rimuove un allegato (solo il riferimento in questo incremento - v. nota nel README). */
export async function eliminaDocumento(documentoId: string) {
  const documento = await db.documentoRichiesta.findUnique({ where: { id: documentoId } });
  if (!documento) return;

  await db.documentoRichiesta.delete({ where: { id: documentoId } });

  await db.eventoAttivita.create({
    data: {
      richiestaId: documento.richiestaId,
      tipo: 'DOCUMENTO_RIMOSSO',
      descrizione: `Documento "${documento.nomeFileOriginale}" rimosso`,
      attore: 'CLIENTE',
    },
  });
}

/**
 * Completa la richiesta: valida l'intera configurazione (tutti gli step) più i
 * contatti, sempre obbligatori per poter essere ricontattati, anche se non fanno
 * parte della configurazione specifica del tipo di progetto. Se tutto è valido,
 * transiziona da BOZZA a NUOVA - da quel momento la richiesta è immutabile lato
 * cliente e visibile alla dashboard amministrativa (Incremento 3).
 */
export async function completaRichiesta(richiestaId: string) {
  const richiesta = await db.richiestaProgetto.findUnique({
    where: { id: richiestaId },
    include: { tipoProgetto: true },
  });
  if (!richiesta) throw new Error('Richiesta non trovata.');
  if (!richiesta.tipoProgetto) throw new Error('Tipo di progetto non caricato correttamente.');

  if (richiesta.stato !== 'BOZZA') {
    return { successo: true as const, richiesta };
  }

  const configurazione = TipoProgettoConfigurazioneSchema.parse(
    richiesta.tipoProgetto.configurazione,
  );
  const datiFormCompleti = datiFormPiatti(richiesta);
  const errori = validaConfigurazioneCompleta(configurazione, datiFormCompleti);

  if (!richiesta.clienteNome || !richiesta.clienteNome.trim()) {
    errori.clienteNome = 'Il nome è necessario per poterti ricontattare.';
  }
  if (!richiesta.clienteEmail || !richiesta.clienteEmail.trim()) {
    errori.clienteEmail = "L'email è necessaria per inviarti la nostra proposta.";
  }

  if (Object.keys(errori).length > 0) {
    return { successo: false as const, errori };
  }

  // CRM: il Cliente viene risolto (trovato o creato) solo ora, al completamento -
  // non a ogni passo del wizard, per lo stesso motivo per cui il pricing si
  // calcola qui e non prima (Configurazione a Valore: un valore reale nasce
  // solo quando la richiesta è davvero inviata).
  const cliente = await trovaOCreaCliente(richiesta.tenantId, {
    nome: richiesta.clienteNome!.trim(),
    email: richiesta.clienteEmail?.trim() || null,
    telefono: richiesta.clienteTelefono?.trim() || null,
    tipo: richiesta.clienteTipo ?? undefined,
    azienda: richiesta.clienteAzienda,
  });

  const aggiornata = await db.richiestaProgetto.update({
    where: { id: richiestaId },
    data: { stato: 'NUOVA', clienteId: cliente.id },
    include: { fasciaBudget: true, tipoProgetto: true },
  });

  await db.eventoAttivita.create({
    data: {
      richiestaId,
      tipo: 'RICHIESTA_COMPLETATA',
      descrizione: 'Richiesta inviata dal cliente',
      attore: 'CLIENTE',
    },
  });

  // Rule Engine: due valutazioni indipendenti sugli stessi fatti condivisi
  // (src/lib/richiesta-fatti.ts) - priorità commerciale (primo consumatore) e
  // fascia di prezzo (secondo consumatore, quello che conta davvero per il
  // cliente: v. pricing-service.ts). Se nessuna Regola attiva matcha in un
  // contesto, semplicemente non succede nulla - il motore non impone default.
  assicuraGestoriRegistrati();
  if (!aggiornata.tipoProgetto) throw new Error('Tipo di progetto non caricato correttamente.');
  const fatti = costruisciFattiRichiesta(
    aggiornata,
    aggiornata.tipoProgetto,
    aggiornata.fasciaBudget ?? null,
  );

  await eseguiRegolePerContesto(
    aggiornata.tenantId,
    'richiesta_priorita_commerciale',
    'richiesta_progetto',
    richiestaId,
    fatti,
  );
  await eseguiRegolePerContesto(
    aggiornata.tenantId,
    CONTESTO_PRICING,
    'richiesta_progetto',
    richiestaId,
    fatti,
    { fermaAlPrimoMatch: true },
  );

  // Rilegge la richiesta per restituire la fascia di prezzo appena calcolata
  // (se una Regola ha matchato) - l'update sopra precede la valutazione.
  const richiestaConPrezzo = await db.richiestaProgetto.findUnique({ where: { id: richiestaId } });

  // Notifiche: lo staff attivo del tenant viene avvisato di ogni nuova
  // richiesta - non configurabile per ora (un atelier piccolo ha 1-3
  // persone, tutte interessate a saperlo; una configurazione "chi vuole
  // essere avvisato" non produce beneficio reale a questa scala).
  const staffAttivo = await db.membership.findMany({
    where: { tenantId: aggiornata.tenantId, stato: 'ATTIVA' },
    include: { utente: true },
  });
  const fasciaTesto =
    richiestaConPrezzo?.fasciaPrezzoMin != null && richiestaConPrezzo?.fasciaPrezzoMax != null
      ? `Fascia stimata: ${richiestaConPrezzo.fasciaPrezzoMin.toLocaleString('it-IT')}–${richiestaConPrezzo.fasciaPrezzoMax.toLocaleString('it-IT')} €.`
      : 'Fascia di prezzo non ancora disponibile per questa combinazione.';
  await Promise.all(
    staffAttivo
      .filter((m) => m.utente?.email)
      .map((m) =>
        getEmailAdapter().invia({
          destinatario: m.utente!.email,
          oggetto: `Nuova richiesta — ${aggiornata.tipoProgetto?.nome ?? 'progetto'}`,
          corpo: `Nuova richiesta da ${aggiornata.clienteNome ?? 'un cliente'} per "${aggiornata.tipoProgetto?.nome}".\n\n${fasciaTesto}\n\nApri la richiesta:\n${process.env.SITE_URL}/admin/richieste/${richiestaId}`,
        }),
      ),
  );

  return { successo: true as const, richiesta: richiestaConPrezzo ?? aggiornata };
}

/** Recupera la richiesta con documenti e configurazione del tipo di progetto, per il riepilogo finale. */
export async function recuperaRiepilogo(richiestaId: string) {
  const richiesta = await db.richiestaProgetto.findUnique({
    where: { id: richiestaId },
    include: { documenti: true, tipoProgetto: true },
  });
  if (!richiesta) throw new Error('Richiesta non trovata.');
  return richiesta;
}
