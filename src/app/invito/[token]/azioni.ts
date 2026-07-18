'use server';

import { db } from '@/server/db';
import { accettaInvito } from '@/server/services/invito-service';
import { hashToken } from '@/lib/identity/token';

/** Recupera i dati essenziali dell'invito (email, azienda, stato) per mostrarli senza consumarlo. */
export async function dettaglioInvitoPubblico(tokenGrezzo: string) {
  const invito = await db.invito.findUnique({ where: { tokenHash: hashToken(tokenGrezzo) } });
  if (!invito) return null;

  const tenant = await db.tenant.findUnique({ where: { id: invito.tenantId } });
  const utenteEsistente = await db.utente.findUnique({ where: { email: invito.email } });

  return {
    email: invito.email,
    tenantNome: tenant?.nome ?? '—',
    stato: invito.stato,
    scaduto: new Date(invito.scadeIl) < new Date(),
    richiedeNuovoAccount: !utenteEsistente,
  };
}

export async function accettaInvitoAzione(
  tokenGrezzo: string,
  dati?: { nome: string; password: string },
) {
  return accettaInvito(tokenGrezzo, dati);
}
