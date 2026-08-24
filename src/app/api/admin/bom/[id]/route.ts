import { NextResponse } from 'next/server';
import {
  ErroreAccessoNegato,
  ErroreNonAutenticato,
  richiediContesto,
} from '@/server/identity/contesto';
import {
  aggiungiRigaBomAdmin,
  cambiaStatoBomAdmin,
  dettaglioBomAdmin,
  eliminaRigaBomAdmin,
} from '@/server/services/bom-admin-service';
import type { StatoBom } from '@/server/services/bom-service';

function errorResponse(error: unknown) {
  if (error instanceof ErroreNonAutenticato) {
    return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
  }
  if (error instanceof ErroreAccessoNegato) {
    return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
  }
  return NextResponse.json(
    { error: error instanceof Error ? error.message : 'Errore BOM' },
    { status: 400 },
  );
}

async function contesto() {
  return richiediContesto({ modulo: 'richieste', azione: 'leggi' });
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await contesto();
    const { id } = await params;
    const bom = await dettaglioBomAdmin(identity.tenantId, id);
    if (!bom) {
      return NextResponse.json({ error: 'Distinta non trovata' }, { status: 404 });
    }
    return NextResponse.json(bom);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const identity = await contesto();
    const { id } = await params;
    const body = await request.json();

    if (body?.azione === 'stato') {
      if (!['BOZZA', 'CONFERMATA', 'CHIUSA'].includes(body.stato)) {
        return NextResponse.json({ error: 'Stato non valido.' }, { status: 400 });
      }
      await cambiaStatoBomAdmin(identity.tenantId, id, body.stato as StatoBom);
      return NextResponse.json({ ok: true });
    }

    if (body?.azione === 'elimina-riga') {
      if (typeof body.rigaId !== 'string') {
        return NextResponse.json({ error: 'rigaId obbligatorio.' }, { status: 400 });
      }
      await eliminaRigaBomAdmin(identity.tenantId, id, body.rigaId);
      return NextResponse.json({ ok: true });
    }

    if (
      body?.categoria == null ||
      body?.descrizione == null ||
      body?.quantita == null
    ) {
      return NextResponse.json(
        { error: 'categoria, descrizione e quantita sono obbligatori.' },
        { status: 400 },
      );
    }

    const rigaId = await aggiungiRigaBomAdmin(identity.tenantId, id, {
      categoria: body.categoria,
      codice: body.codice ?? null,
      descrizione: body.descrizione,
      unita: body.unita ?? 'pz',
      quantita: Number(body.quantita),
      materiale: body.materiale ?? null,
      lavorazione: body.lavorazione ?? null,
      costoUnitario:
        body.costoUnitario == null ? null : Number(body.costoUnitario),
      note: body.note ?? null,
      ordinamento:
        body.ordinamento == null ? undefined : Number(body.ordinamento),
    });
    return NextResponse.json({ id: rigaId }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
