import { NextRequest, NextResponse } from 'next/server';
import { listaRichieste, type FiltriRichieste } from '@/server/services/richieste-service';
import {
  richiediContesto,
  ErroreNonAutenticato,
  ErroreAccessoNegato,
} from '@/server/identity/contesto';
import type { StatoRichiesta } from '@prisma/client';

/**
 * GET /api/richieste
 *
 * Query string: ricerca, stato, tipoProgettoId, livelloCompletezza, fasciaBudgetId,
 * dataDa, dataA, pagina, perPagina, ordinaPer, direzione.
 *
 * Endpoint "API First": la pagina /admin/richieste chiama questa stessa funzione
 * di servizio direttamente (per efficienza in Server Component), ma la logica è
 * identica ed esposta qui via HTTP per essere riutilizzabile da ArtigianOS o da
 * un futuro client esterno, senza duplicazione. Autenticazione + permesso +
 * Tenant verificati qui indipendentemente dal comportamento del frontend
 * (vincolo esplicito, Incremento 5).
 */
export async function GET(request: NextRequest) {
  let contesto;
  try {
    contesto = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
  } catch (e) {
    if (e instanceof ErroreNonAutenticato)
      return NextResponse.json({ errore: 'Non autenticato.' }, { status: 401 });
    if (e instanceof ErroreAccessoNegato)
      return NextResponse.json({ errore: 'Permesso negato.' }, { status: 403 });
    throw e;
  }

  const params = request.nextUrl.searchParams;

  const filtri: FiltriRichieste = {
    ricerca: params.get('ricerca') ?? undefined,
    stato: (params.get('stato') as StatoRichiesta) ?? undefined,
    tipoProgettoId: params.get('tipoProgettoId') ?? undefined,
    livelloCompletezza:
      (params.get('livelloCompletezza') as FiltriRichieste['livelloCompletezza']) ?? undefined,
    fasciaBudgetId: params.get('fasciaBudgetId') ?? undefined,
    dataDa: params.get('dataDa') ?? undefined,
    dataA: params.get('dataA') ?? undefined,
    pagina: params.get('pagina') ? Number(params.get('pagina')) : undefined,
    perPagina: params.get('perPagina') ? Number(params.get('perPagina')) : undefined,
    ordinaPer: (params.get('ordinaPer') as FiltriRichieste['ordinaPer']) ?? undefined,
    direzione: (params.get('direzione') as FiltriRichieste['direzione']) ?? undefined,
  };

  const risultato = await listaRichieste(contesto.tenantId, filtri);
  return NextResponse.json(risultato);
}
