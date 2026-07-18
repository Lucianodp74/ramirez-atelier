import { NextResponse } from 'next/server';
import { cambiaStato } from '@/server/services/richieste-service';
import {
  richiediContesto,
  ErroreNonAutenticato,
  ErroreAccessoNegato,
} from '@/server/identity/contesto';
import type { StatoRichiesta } from '@prisma/client';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let contesto;
  try {
    contesto = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
  } catch (e) {
    if (e instanceof ErroreNonAutenticato)
      return NextResponse.json({ errore: 'Non autenticato.' }, { status: 401 });
    if (e instanceof ErroreAccessoNegato)
      return NextResponse.json({ errore: 'Permesso negato.' }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const body = await request.json();
  const nuovoStato = body.stato as StatoRichiesta | undefined;

  if (!nuovoStato) {
    return NextResponse.json(
      { errore: 'Campo "stato" mancante nel corpo della richiesta.' },
      { status: 400 },
    );
  }

  const esito = await cambiaStato(contesto.tenantId, id, nuovoStato);
  if (!esito.successo) {
    return NextResponse.json({ errore: esito.errore }, { status: 409 });
  }

  return NextResponse.json(esito.richiesta);
}
