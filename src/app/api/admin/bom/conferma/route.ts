import { NextResponse } from 'next/server';
import { richiediContesto, ErroreNonAutenticato, ErroreAccessoNegato } from '@/server/identity/contesto';
import { cambiaStatoBomAdmin, dettaglioBomAdmin } from '@/server/services/bom-admin-service';

function errorResponse(error: unknown) {
  if (error instanceof ErroreNonAutenticato) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  if (error instanceof ErroreAccessoNegato) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
  return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore conferma BOM' }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const identity = await richiediContesto({ modulo: 'richieste', azione: 'cambia_stato' });
    const body = await request.json();
    const bomId = typeof body?.bomId === 'string' ? body.bomId : '';
    if (!bomId) return NextResponse.json({ error: 'bomId obbligatorio' }, { status: 400 });
    const bom = await dettaglioBomAdmin(identity.tenantId, bomId);
    if (!bom) return NextResponse.json({ error: 'Distinta non trovata' }, { status: 404 });
    if (bom.stato !== 'BOZZA') return NextResponse.json({ error: 'La distinta non è in stato BOZZA.' }, { status: 409 });
    if (bom.righe.length === 0 || bom.righe.some((riga) => riga.costoUnitario == null)) return NextResponse.json({ error: 'Completa tutti i costi della BOM prima di confermarla.' }, { status: 400 });
    await cambiaStatoBomAdmin(identity.tenantId, bomId, 'CONFERMATA');
    return NextResponse.json({ ok: true, stato: 'CONFERMATA' });
  } catch (error) { return errorResponse(error); }
}
