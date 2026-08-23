import { NextResponse } from 'next/server';
import { riepilogoCostoBom } from '@/server/services/bom-pricing-service';
import { richiediContesto, ErroreNonAutenticato, ErroreAccessoNegato } from '@/server/identity/contesto';

export async function GET(request: Request) {
  try {
    const identity = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
    const bomId = new URL(request.url).searchParams.get('bomId');
    if (!bomId) return NextResponse.json({ error: 'bomId obbligatorio' }, { status: 400 });

    const summary = await riepilogoCostoBom(identity.tenantId, bomId);
    if (!summary) return NextResponse.json({ error: 'Distinta non trovata' }, { status: 404 });
    return NextResponse.json(summary);
  } catch (error) {
    if (error instanceof ErroreNonAutenticato) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    if (error instanceof ErroreAccessoNegato) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore riepilogo costi BOM' }, { status: 400 });
  }
}
