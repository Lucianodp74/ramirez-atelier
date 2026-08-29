import { NextResponse } from 'next/server';
import { richiediContesto, ErroreNonAutenticato, ErroreAccessoNegato } from '@/server/identity/contesto';
import {
  creaBomAdmin,
  dettaglioBomAdmin,
  listaBomAdmin,
} from '@/server/services/bom-admin-service';

async function contesto() {
  return richiediContesto({ modulo: 'richieste', azione: 'leggi' });
}

function errorResponse(error: unknown) {
  if (error instanceof ErroreNonAutenticato) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  if (error instanceof ErroreAccessoNegato) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
  return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore BOM' }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const identity = await contesto();
    const params = new URL(request.url).searchParams;
    const id = params.get('id');
    const richiestaId = params.get('richiestaId');
    if (id) {
      const bom = await dettaglioBomAdmin(identity.tenantId, id);
      if (!bom) return NextResponse.json({ error: 'Distinta non trovata' }, { status: 404 });
      return NextResponse.json(bom);
    }
    const data = await listaBomAdmin(identity.tenantId);
    if (richiestaId) {
      return NextResponse.json({ data: data.filter((bom) => bom.richiestaId === richiestaId) });
    }
    return NextResponse.json({ data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = await contesto();
    const body = await request.json();
    if (!body?.richiestaId || typeof body.richiestaId !== 'string') {
      return NextResponse.json({ error: 'richiestaId obbligatorio' }, { status: 400 });
    }
    const id = await creaBomAdmin(identity.tenantId, {
      richiestaId: body.richiestaId,
      noteProduzione: body.noteProduzione ?? null,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
