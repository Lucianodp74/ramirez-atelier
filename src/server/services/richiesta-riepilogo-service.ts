import { db } from '@/server/db';

/** Recupera il riepilogo cliente solo quando ID e token appartengono alla stessa richiesta. */
export async function recuperaRiepilogoConToken(richiestaId: string, tokenRipresa: string) {
  if (!tokenRipresa || tokenRipresa.length < 20) {
    throw new Error('Token di accesso non valido.');
  }

  const richiesta = await db.richiestaProgetto.findFirst({
    where: { id: richiestaId, tokenRipresa },
    include: { documenti: true, tipoProgetto: true },
  });

  if (!richiesta) throw new Error('Richiesta non trovata.');
  return richiesta;
}
