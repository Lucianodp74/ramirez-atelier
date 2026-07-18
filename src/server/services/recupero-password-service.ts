import { db } from '@/server/db';
import { calcolaHashPassword, validaPassword } from '@/lib/identity/password';
import { generaTokenOpaco, hashToken } from '@/lib/identity/token';
import { registraEventoSicurezza } from './sicurezza-eventi-service';

const DURATA_TOKEN_MS = 1000 * 60 * 30; // 30 minuti - scadenza breve

export async function richiediRecuperoPassword(
  email: string,
): Promise<{ tokenGrezzo: string } | null> {
  const utente = await db.utente.findUnique({ where: { email } });
  // Non rivela se l'email esiste o no (stesso principio del login) - il
  // chiamante (route API) risponde sempre con lo stesso messaggio generico.
  if (!utente) return null;

  // Una nuova richiesta invalida quelle precedenti non ancora usate - evita
  // che un vecchio link resti valido in una casella di posta.
  await db.richiestaRecuperoPassword.updateMany({
    where: { utenteId: utente.id },
    data: { usataIl: new Date() },
  });

  const tokenGrezzo = generaTokenOpaco();
  await db.richiestaRecuperoPassword.create({
    data: {
      utenteId: utente.id,
      tokenHash: hashToken(tokenGrezzo),
      scadeIl: new Date(Date.now() + DURATA_TOKEN_MS),
    },
  });

  await registraEventoSicurezza({ tipo: 'RECUPERO_PASSWORD_RICHIESTO', utenteId: utente.id });

  return { tokenGrezzo };
}

export async function completaRecuperoPassword(
  tokenGrezzo: string,
  nuovaPassword: string,
): Promise<{ successo: boolean; errore?: string }> {
  const richiesta = await db.richiestaRecuperoPassword.findUnique({
    where: { tokenHash: hashToken(tokenGrezzo) },
  });
  if (!richiesta) return { successo: false, errore: 'Link di recupero non valido.' };
  if (richiesta.usataIl)
    return { successo: false, errore: 'Questo link è già stato usato o non è più valido.' };
  if (new Date(richiesta.scadeIl) < new Date())
    return { successo: false, errore: 'Link di recupero scaduto.' };

  const erroreValidazione = validaPassword(nuovaPassword);
  if (erroreValidazione) return { successo: false, errore: erroreValidazione };

  await db.utente.update({
    where: { id: richiesta.utenteId },
    data: { passwordHash: await calcolaHashPassword(nuovaPassword) },
  });
  await db.richiestaRecuperoPassword.update({
    where: { id: richiesta.id },
    data: { usataIl: new Date() },
  });

  await registraEventoSicurezza({
    tipo: 'RECUPERO_PASSWORD_COMPLETATO',
    utenteId: richiesta.utenteId,
  });

  return { successo: true };
}
