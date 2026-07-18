import { NextResponse } from 'next/server';
import { riepilogoDashboard } from '@/server/services/richieste-service';
import {
  richiediContesto,
  ErroreNonAutenticato,
  ErroreAccessoNegato,
} from '@/server/identity/contesto';

export async function GET() {
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

  const riepilogo = await riepilogoDashboard(contesto.tenantId);
  return NextResponse.json(riepilogo);
}
