import { NextResponse } from 'next/server';
import { salvaPreventivoBom, ultimoPreventivoBom } from '@/server/services/bom-preventivo-service';
import {
  ErroreAccessoNegato,
  ErroreNonAutenticato,
  richiediContesto,
} from '@/server/identity/contesto';

function errorResponse(error: unknown) {
  if (error instanceof ErroreNonAutenticato) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  if (error instanceof ErroreAccessoNegato) return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
  return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore preventivo' }, { status: 400 });
}

export async function GET(request: Request) {
  try {
    const identity = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
    const bomId = new URL(request.url).searchParams.get('bomId');
    if (!bomId) return NextResponse.json({ error: 'bomId obbligatorio' }, { status: 400 });
    return NextResponse.json({ preventivo: await ultimoPreventivoBom(identity.tenantId, bomId) });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const identity = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
    const body = await request.json();
    if (!body?.bomId || typeof body.bomId !== 'string') {
      return NextResponse.json({ error: 'bomId obbligatorio' }, { status: 400 });
    }

    const preventivo = await salvaPreventivoBom(identity.tenantId, body.bomId, {
      ricaricoPercentuale: body.ricaricoPercentuale,
      costiFissi: body.costiFissi,
      lavorazioni: body.lavorazioni,
      manodopera: body.manodopera,
      spese: body.spese,
      scontoPercentuale: body.scontoPercentuale,
      ivaPercentuale: body.ivaPercentuale,
    });

    return NextResponse.json({ preventivo }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
