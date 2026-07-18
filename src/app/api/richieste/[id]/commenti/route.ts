import { NextResponse } from 'next/server';
import { aggiungiCommento } from '@/server/services/richieste-service';
import {
  richiediContesto,
  ErroreNonAutenticato,
  ErroreAccessoNegato,
} from '@/server/identity/contesto';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  let contesto;
  try {
    contesto = await richiediContesto({ modulo: 'richieste', azione: 'commenta' });
  } catch (e) {
    if (e instanceof ErroreNonAutenticato)
      return NextResponse.json({ errore: 'Non autenticato.' }, { status: 401 });
    if (e instanceof ErroreAccessoNegato)
      return NextResponse.json({ errore: 'Permesso negato.' }, { status: 403 });
    throw e;
  }

  const { id } = await params;
  const body = await request.json();
  const testo = typeof body.testo === 'string' ? body.testo : '';

  try {
    const commento = await aggiungiCommento(contesto.tenantId, id, testo, contesto.utenteNome);
    return NextResponse.json(commento, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { errore: e instanceof Error ? e.message : 'Errore imprevisto.' },
      { status: 400 },
    );
  }
}
