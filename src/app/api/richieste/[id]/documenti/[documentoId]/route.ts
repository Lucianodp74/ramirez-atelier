import { NextResponse } from 'next/server';
import { db } from '@/server/db';
import { getStorageAdapter } from '@/lib/storage';
import {
  richiediContesto,
  ErroreNonAutenticato,
  ErroreAccessoNegato,
} from '@/server/identity/contesto';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; documentoId: string }> },
) {
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

  const { id, documentoId } = await params;

  const documento = await db.documentoRichiesta.findUnique({
    where: { id: documentoId },
    include: { richiesta: true },
  });

  // Verifica che il documento esista, appartenga davvero alla richiesta indicata
  // nell'URL e al tenant dell'utente autenticato - non basta che l'id esista,
  // altrimenti un utente potrebbe indovinare l'id di un documento di un altro
  // tenant o di un'altra richiesta.
  if (
    !documento ||
    documento.richiestaId !== id ||
    documento.richiesta.tenantId !== contesto.tenantId
  ) {
    return NextResponse.json({ errore: 'Documento non trovato.' }, { status: 404 });
  }

  const adattatore = getStorageAdapter();
  const risultato = await adattatore.scarica(documento.storageObjectKey);

  if (risultato.tipo === 'redirect') {
    return NextResponse.redirect(risultato.url);
  }

  return new NextResponse(risultato.buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': documento.tipoMime,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(documento.nomeFileOriginale)}"`,
      'Content-Length': String(documento.dimensioneByte),
    },
  });
}
