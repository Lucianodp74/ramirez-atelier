import { db } from '@/server/db';
import { calcolaHashPassword, validaPassword } from '@/lib/identity/password';
import { generaTokenOpaco, hashToken } from '@/lib/identity/token';
import { registraEventoSicurezza } from './sicurezza-eventi-service';

const DURATA_INVITO_MS = 1000 * 60 * 60 * 24 * 7; // 7 giorni

export async function creaInvito(
  tenantId: string,
  email: string,
  ruoloIniziale: string,
  creatoDaUtenteId?: string,
) {
  const tokenGrezzo = generaTokenOpaco();

  // Un nuovo invito invalida quelli precedenti non ancora accettati per la
  // stessa email - stesso principio già applicato al recupero password
  // (v. recupero-password-service.ts): altrimenti un vecchio link, mai
  // accettato né revocato esplicitamente, resterebbe valido per sempre anche
  // dopo un invito più recente con un ruolo diverso.
  await db.invito.updateMany({
    where: { tenantId, email, stato: 'CREATO' },
    data: { stato: 'REVOCATO' },
  });

  const invito = await db.invito.create({
    data: {
      tenantId,
      email,
      ruoloIniziale,
      tokenHash: hashToken(tokenGrezzo),
      scadeIl: new Date(Date.now() + DURATA_INVITO_MS),
      creatoDaUtenteId: creatoDaUtenteId ?? null,
    },
  });

  await registraEventoSicurezza({
    tipo: 'INVITO_CREATO',
    tenantId,
    utenteId: creatoDaUtenteId,
    metadati: { email, ruoloIniziale },
  });

  // Il token grezzo va restituito solo qui (per costruire il link da inviare via
  // email) - non viene mai più recuperabile una volta salvato solo l'hash.
  return { invito, tokenGrezzo };
}

export async function elencoInviti(tenantId: string) {
  return db.invito.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
}

export async function revocaInvito(tenantId: string, invitoId: string) {
  const invito = await db.invito.findUnique({ where: { id: invitoId } });
  if (!invito || invito.tenantId !== tenantId) throw new Error('Invito non trovato.');
  return db.invito.update({ where: { id: invitoId }, data: { stato: 'REVOCATO' } });
}

/**
 * Distingue i due casi previsti dall'ADR: se esiste già un Utente con questa
 * email (magari con Membership in altri Tenant), crea solo la nuova Membership;
 * altrimenti crea Utente e Membership insieme, con la password scelta ora.
 */
export interface EsitoAccettazioneInvito {
  successo: boolean;
  errore?: string;
}

export async function accettaInvito(
  tokenGrezzo: string,
  datiNuovoUtente?: { nome: string; password: string },
): Promise<EsitoAccettazioneInvito> {
  const invito = await db.invito.findUnique({ where: { tokenHash: hashToken(tokenGrezzo) } });
  if (!invito) return { successo: false, errore: 'Invito non valido.' };
  if (invito.stato !== 'CREATO') return { successo: false, errore: 'Invito già usato o revocato.' };
  if (new Date(invito.scadeIl) < new Date()) return { successo: false, errore: 'Invito scaduto.' };

  let utente = await db.utente.findUnique({ where: { email: invito.email } });

  if (!utente) {
    if (!datiNuovoUtente) {
      return {
        successo: false,
        errore: 'Dati necessari per creare un nuovo account (nome, password).',
      };
    }
    const erroreValidazione = validaPassword(datiNuovoUtente.password);
    if (erroreValidazione) return { successo: false, errore: erroreValidazione };

    utente = await db.utente.create({
      data: {
        email: invito.email,
        nome: datiNuovoUtente.nome,
        passwordHash: await calcolaHashPassword(datiNuovoUtente.password),
      },
    });
  }

  const ruolo = await db.ruolo.findMany({
    where: { tenantId: invito.tenantId, nome: invito.ruoloIniziale },
  });
  if (ruolo.length === 0)
    return { successo: false, errore: 'Ruolo iniziale non trovato per questo Tenant.' };

  const membershipEsistente = await db.membership.findMany({
    where: { utenteId: utente.id, tenantId: invito.tenantId },
  });
  if (membershipEsistente.length === 0) {
    const membership = await db.membership.create({
      data: { utenteId: utente.id, tenantId: invito.tenantId, stato: 'ATTIVA' },
    });
    await db.membershipRuolo.create({
      data: { membershipId: membership.id, ruoloId: ruolo[0].id },
    });
  }

  await db.invito.update({
    where: { id: invito.id },
    data: { stato: 'ACCETTATO', accettatoIl: new Date() },
  });

  await registraEventoSicurezza({
    tipo: 'INVITO_ACCETTATO',
    tenantId: invito.tenantId,
    utenteId: utente.id,
  });

  return { successo: true };
}
