import { NextResponse } from 'next/server';
import { dettaglioRichiesta } from '@/server/services/richieste-service';
import {
  richiediContesto,
  ErroreNonAutenticato,
  ErroreAccessoNegato,
} from '@/server/identity/contesto';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
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

  const { id } = await params;
  const richiesta = await dettaglioRichiesta(contesto.tenantId, id);
  if (!richiesta) {
    return NextResponse.json({ errore: 'Richiesta non trovata.' }, { status: 404 });
  }
  return NextResponse.json(richiesta);
}
