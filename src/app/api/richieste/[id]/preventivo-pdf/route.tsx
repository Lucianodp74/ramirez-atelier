import { NextResponse } from 'next/server';
import { generaPreventivoPdfBuffer } from '@/lib/pdf/genera-preventivo-pdf';
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

  let risultato;
  try {
    risultato = await generaPreventivoPdfBuffer(contesto.tenantId, id);
  } catch {
    return NextResponse.json({ errore: 'Richiesta non trovata.' }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(risultato.buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="preventivo-${risultato.numeroPreventivo}.pdf"`,
    },
  });
}
