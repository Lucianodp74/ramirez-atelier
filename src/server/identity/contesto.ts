import { cookies } from 'next/headers';
import { recuperaSessioneCorrente } from '@/server/services/auth-service';
import { haPermesso } from '@/server/services/permission-service';
import { registraEventoSicurezza } from '@/server/services/sicurezza-eventi-service';

export const NOME_COOKIE_SESSIONE = 'ra_sessione_admin';

export class ErroreNonAutenticato extends Error {
  constructor() {
    super('Autenticazione richiesta.');
    this.name = 'ErroreNonAutenticato';
  }
}

export class ErroreAccessoNegato extends Error {
  constructor(modulo: string, azione: string) {
    super(`Permesso mancante: ${modulo}.${azione}`);
    this.name = 'ErroreAccessoNegato';
  }
}

export interface ContestoAutenticato {
  utenteId: string;
  utenteNome: string;
  membershipId: string;
  tenantId: string;
}

/**
 * Legge la sessione dal cookie (mai un fallback implicito: se il cookie manca,
 * o la sessione non è valida, l'operazione fallisce con ErroreNonAutenticato -
 * vincolo esplicito richiesto). Se `moduloAzione` è fornito, verifica anche il
 * permesso, registrando un evento ACCESSO_NEGATO in caso di rifiuto.
 *
 * Va invocato all'inizio di OGNI servizio di business che opera sull'area
 * amministrativa e di OGNI route API corrispondente - indipendentemente dal
 * comportamento del frontend (vincolo esplicito: l'autorizzazione reale è
 * solo lato server).
 */
export async function richiediContesto(moduloAzione?: {
  modulo: string;
  azione: string;
}): Promise<ContestoAutenticato> {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_COOKIE_SESSIONE)?.value;

  if (!token) throw new ErroreNonAutenticato();

  const sessione = await recuperaSessioneCorrente(token);
  if (!sessione) throw new ErroreNonAutenticato();

  const contesto: ContestoAutenticato = {
    utenteId: sessione.utenteId,
    utenteNome: sessione.utente!.nome,
    membershipId: sessione.membershipId,
    tenantId: sessione.membership!.tenantId,
  };

  if (moduloAzione) {
    const consentito = await haPermesso(
      contesto.membershipId,
      moduloAzione.modulo,
      moduloAzione.azione,
    );
    if (!consentito) {
      await registraEventoSicurezza({
        tipo: 'ACCESSO_NEGATO',
        utenteId: contesto.utenteId,
        tenantId: contesto.tenantId,
        membershipId: contesto.membershipId,
        metadati: { modulo: moduloAzione.modulo, azione: moduloAzione.azione },
      });
      throw new ErroreAccessoNegato(moduloAzione.modulo, moduloAzione.azione);
    }
  }

  return contesto;
}

/** Variante che non lancia eccezioni - utile per i layout che devono solo decidere se reindirizzare al login. */
export async function contestoOpzionale(): Promise<ContestoAutenticato | null> {
  try {
    return await richiediContesto();
  } catch {
    return null;
  }
}
