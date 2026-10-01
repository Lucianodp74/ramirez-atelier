import { NextResponse } from 'next/server';
import { richiediContesto, ErroreAccessoNegato, ErroreNonAutenticato } from '@/server/identity/contesto';
import { generaPropostaBom } from '@/server/services/bom-service';

export async function POST(request: Request) {
  try {
    const identity = await richiediContesto({ modulo: 'richieste', azione: 'scrivi' });
    const body = await request.json();
    if (!body?.richiestaId || typeof body.richiestaId !== 'string') {
      return NextResponse.json({ error: 'richiestaId obbligatorio' }, { status: 400 });
    }

    const risultato = await generaPropostaBom(identity.tenantId, body.richiestaId);
    return NextResponse.json(risultato);
  } catch (error) {
    if (error instanceof ErroreNonAutenticato) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    if (error instanceof ErroreAccessoNegato) {
      return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    }
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Errore generazione BOM' }, { status: 400 });
  }
}
