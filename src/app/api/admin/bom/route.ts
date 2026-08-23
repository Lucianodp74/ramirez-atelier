import { NextResponse } from 'next/server';
import { creaBom, dettaglioBom } from '@/server/services/bom-service';
import { richiediContesto, ErroreNonAutenticato, ErroreAccessoNegato } from '@/server/identity/contesto';

async function contesto() {
  return richiediContesto({ modulo: 'richieste', azione: 'leggi' });
}

export async function GET(request: Request) {
  try {
    const identity = await contesto();
    const id = new URL(request.url).searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 });
    const bom = await dettaglioBom(identity.tenantId, id);
    if (!bom) return NextResponse.json({ error: 'Distinta non trovata' }, { status: 404 });
    return NextResponse.json(bom);
  } catch (error) {
    if (error instanceof ErroreNonAutenticato) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    if (error instanceof ErroreAccessoNegato) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const identity = await contesto();
    const body = await request.json();
    if (!body?.richiestaId || typeof body.richiestaId !== 'string') {
      return NextResponse.json({ error: 'richiestaId obbligatorio' }, { status: 400 });
    }
    const id = await creaBom(identity.tenantId, {
      richiestaId: body.richiestaId,
      noteProduzione: body.noteProduzione ?? null,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof ErroreNonAutenticato) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    if (error instanceof ErroreAccessoNegato) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore BOM' }, { status: 400 });
  }
}
