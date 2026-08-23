import { NextResponse } from 'next/server';
import { creaBom, dettaglioBom } from '@/server/services/bom-service';
import { getIdentity } from '@/server/identity';

export async function GET(request: Request) {
  const identity = await getIdentity();
  if (!identity) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id obbligatorio' }, { status: 400 });
  const bom = await dettaglioBom(identity.tenantId, id);
  if (!bom) return NextResponse.json({ error: 'Distinta non trovata' }, { status: 404 });
  return NextResponse.json(bom);
}

export async function POST(request: Request) {
  const identity = await getIdentity();
  if (!identity) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  const body = await request.json();
  if (!body?.richiestaId || typeof body.richiestaId !== 'string') {
    return NextResponse.json({ error: 'richiestaId obbligatorio' }, { status: 400 });
  }
  try {
    const id = await creaBom(identity.tenantId, { richiestaId: body.richiestaId, noteProduzione: body.noteProduzione ?? null });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore BOM' }, { status: 400 });
  }
}
