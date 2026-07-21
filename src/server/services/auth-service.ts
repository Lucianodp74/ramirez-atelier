import { db } from '@/server/db';
import { verificaPassword, calcolaHashPassword, validaPassword } from '@/lib/identity/password';
import { generaTokenOpaco, hashToken } from '@/lib/identity/token';
import { registraEventoSicurezza } from './sicurezza-eventi-service';

const DURATA_SESSIONE_MS = 1000 * 60 * 60 * 24 * 7; // 7 giorni

/**
 * Rate limiting sui tentativi di login (Threat Model §4.1, rischio rimandato
 * nell'Incremento 5, chiuso qui): riusa il registro evento_sicurezza già
 * esistente (nessuna nuova tabella) - conta i LOGIN_FALLITO recenti per
 * quell'Utente. Deliberatamente applicato solo quando l'Utente esiste (non
 * possiamo tracciare tentativi per un'email inesistente senza introdurre un
 * meccanismo di query per contenuto JSON che l'adattatore di verifica di
 * questo sandbox non supporta - scope cut accettato, il rischio reale è sul
 * furto di un account esistente, non sull'enumerazione stessa).
 */
const MAX_TENTATIVI_FALLITI = 5;
const FINESTRA_BLOCCO_MINUTI = 15;

export interface EsitoLogin {
  successo: boolean;
  tokenSessione?: string;
  errore?: string;
}

async function superatoLimiteTentativi(utenteId: string): Promise<boolean> {
  const dallaData = new Date(Date.now() - FINESTRA_BLOCCO_MINUTI * 60 * 1000);
  const tentativiRecenti = await db.eventoSicurezza.findMany({
    where: { tipo: 'LOGIN_FALLITO', utenteId },
  });
  const recenti = tentativiRecenti.filter((e) => new Date(e.creatoIl) >= dallaData);
  return recenti.length >= MAX_TENTATIVI_FALLITI;
}

/**
 * AutenticatoreUtente (ADR-0004 §6). Se l'Utente ha più Membership attive,
 * seleziona la prima come Tenant attivo iniziale - il chiamante potrà poi
 * invocare `cambiaTenantAttivo`. Non rivela mai se è l'email o la password a
 * essere sbagliata (stesso messaggio d'errore per entrambi i casi, per non
 * facilitare l'enumerazione di indirizzi email registrati).
 */
export async function login(
  email: string,
  password: string,
  contesto: { ipAddress?: string; userAgent?: string } = {},
): Promise<EsitoLogin> {
  const utente = await db.utente.findUnique({ where: { email } });

  if (!utente || utente.stato !== 'ATTIVO') {
    await registraEventoSicurezza({
      tipo: 'LOGIN_FALLITO',
      metadati: { email, motivo: !utente ? 'utente_inesistente' : 'utente_disabilitato' },
      ipAddress: contesto.ipAddress,
    });
    return { successo: false, errore: 'Email o password non corretti.' };
  }

  if (await superatoLimiteTentativi(utente.id)) {
    await registraEventoSicurezza({
      tipo: 'LOGIN_FALLITO',
      utenteId: utente.id,
      metadati: { motivo: 'rate_limit_superato' },
      ipAddress: contesto.ipAddress,
    });
    return {
      successo: false,
      errore: `Troppi tentativi falliti. Riprova tra qualche minuto.`,
    };
  }

  const passwordValida = await verificaPassword(password, utente.passwordHash);
  if (!passwordValida) {
    await registraEventoSicurezza({
      tipo: 'LOGIN_FALLITO',
      utenteId: utente.id,
      metadati: { motivo: 'password_errata' },
      ipAddress: contesto.ipAddress,
    });
    return { successo: false, errore: 'Email o password non corretti.' };
  }

  const membershipAttive = await db.membership.findMany({
    where: { utenteId: utente.id, stato: 'ATTIVA' },
  });
  if (membershipAttive.length === 0) {
    await registraEventoSicurezza({
      tipo: 'LOGIN_FALLITO',
      utenteId: utente.id,
      metadati: { motivo: 'nessuna_membership_attiva' },
      ipAddress: contesto.ipAddress,
    });
    return { successo: false, errore: 'Nessuna azienda associata a questo account.' };
  }

  const membershipIniziale = membershipAttive[0];
  const tokenGrezzo = generaTokenOpaco();

  await db.sessione.create({
    data: {
      utenteId: utente.id,
      membershipId: membershipIniziale.id,
      tokenHash: hashToken(tokenGrezzo),
      scadeIl: new Date(Date.now() + DURATA_SESSIONE_MS),
      ipAddress: contesto.ipAddress ?? null,
      userAgent: contesto.userAgent ?? null,
    },
  });

  await registraEventoSicurezza({
    tipo: 'LOGIN_RIUSCITO',
    utenteId: utente.id,
    tenantId: membershipIniziale.tenantId,
    membershipId: membershipIniziale.id,
    ipAddress: contesto.ipAddress,
  });

  return { successo: true, tokenSessione: tokenGrezzo };
}

/**
 * Recupera la sessione corrente a partire dal token grezzo (dal cookie).
 * Verifica esplicitamente stato ATTIVA e non scaduta - nessun fallback implicito
 * (vincolo esplicito): se manca o non è valida, ritorna null, mai una sessione
 * "di cortesia".
 */
export async function recuperaSessioneCorrente(tokenGrezzo: string) {
  const sessione = await db.sessione.findUnique({
    where: { tokenHash: hashToken(tokenGrezzo) },
    include: { utente: true, membership: { include: { ruoli: true } } },
  });

  if (!sessione) return null;
  if (sessione.stato !== 'ATTIVA') return null;
  if (new Date(sessione.scadeIl) < new Date()) return null;
  if (!sessione.utente || sessione.utente.stato !== 'ATTIVO') return null;
  if (!sessione.membership || sessione.membership.stato !== 'ATTIVA') return null;

  return sessione;
}

export async function logout(tokenGrezzo: string) {
  const sessione = await db.sessione.findUnique({ where: { tokenHash: hashToken(tokenGrezzo) } });
  if (!sessione) return;

  await db.sessione.update({
    where: { id: sessione.id },
    data: { stato: 'REVOCATA', revocataIl: new Date() },
  });

  await registraEventoSicurezza({
    tipo: 'LOGOUT',
    utenteId: sessione.utenteId,
    membershipId: sessione.membershipId,
  });
}

export interface EsitoCambioTenant {
  successo: boolean;
  errore?: string;
}

/**
 * Cambia il Tenant attivo della sessione corrente (ADR-0004 §5): verifica che
 * esista una Membership attiva per il nuovo Tenant, ma non richiede una nuova
 * autenticazione - le credenziali restano quelle dell'identità globale.
 */
export async function cambiaTenantAttivo(
  tokenGrezzo: string,
  nuovoTenantId: string,
): Promise<EsitoCambioTenant> {
  const sessione = await recuperaSessioneCorrente(tokenGrezzo);
  if (!sessione) return { successo: false, errore: 'Sessione non valida.' };

  const nuovaMembership = await db.membership.findMany({
    where: { utenteId: sessione.utenteId, tenantId: nuovoTenantId, stato: 'ATTIVA' },
  });
  if (nuovaMembership.length === 0) {
    return { successo: false, errore: 'Nessuna Membership attiva per questa azienda.' };
  }

  await db.sessione.update({
    where: { id: sessione.id },
    data: { membershipId: nuovaMembership[0].id },
  });

  await registraEventoSicurezza({
    tipo: 'CAMBIO_TENANT_ATTIVO',
    utenteId: sessione.utenteId,
    tenantId: nuovoTenantId,
    membershipId: nuovaMembership[0].id,
  });

  return { successo: true };
}

export async function cambiaPassword(
  utenteId: string,
  nuovaPassword: string,
): Promise<{ successo: boolean; errore?: string }> {
  const erroreValidazione = validaPassword(nuovaPassword);
  if (erroreValidazione) return { successo: false, errore: erroreValidazione };

  const nuovoHash = await calcolaHashPassword(nuovaPassword);
  await db.utente.update({ where: { id: utenteId }, data: { passwordHash: nuovoHash } });

  await registraEventoSicurezza({ tipo: 'CAMBIO_PASSWORD', utenteId });

  return { successo: true };
}
