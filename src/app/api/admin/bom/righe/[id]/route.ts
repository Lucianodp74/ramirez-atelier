import { NextResponse } from 'next/server';
import { ErroreAccessoNegato, ErroreNonAutenticato, richiediContesto } from '@/server/identity/contesto';
import { haPermesso } from '@/server/services/permission-service';
import { aggiornaRigaBom, storicoPrezzoBomRiga } from '@/server/services/bom-service';

async function contestoGestioneBom() {
  const identity = await richiediContesto();
  const [puoGestireRichieste, puoGestireCatalogo] = await Promise.all([
    haPermesso(identity.membershipId, 'richieste', 'gestisci'),
    haPermesso(identity.membershipId, 'catalogo', 'gestisci'),
  ]);
  if (!puoGestireRichieste && !puoGestireCatalogo) {
    throw new ErroreAccessoNegato('bom', 'gestisci');
  }
  return identity;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await contestoGestioneBom();
    const { id } = await params;
    const storico = await storicoPrezzoBomRiga(identity.tenantId, id);
    return NextResponse.json({ storico });
  } catch (error) {
    if (error instanceof ErroreNonAutenticato) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    if (error instanceof ErroreAccessoNegato) {
      return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore storico prezzo BOM' },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const identity = await contestoGestioneBom();
    const { id } = await params;
    const body = (await request.json()) as Record<string, unknown>;

    const input = {
      categoria: typeof body.categoria === 'string' ? body.categoria : undefined,
      codice: body.codice === null || typeof body.codice === 'string' ? (body.codice as string | null | undefined) : undefined,
      descrizione: typeof body.descrizione === 'string' ? body.descrizione : undefined,
      unita: typeof body.unita === 'string' ? body.unita : undefined,
      quantita: typeof body.quantita === 'number' ? body.quantita : undefined,
      materiale: body.materiale === null || typeof body.materiale === 'string' ? (body.materiale as string | null | undefined) : undefined,
      lavorazione: body.lavorazione === null || typeof body.lavorazione === 'string' ? (body.lavorazione as string | null | undefined) : undefined,
      costoUnitario: body.costoUnitario === null || typeof body.costoUnitario === 'number' ? (body.costoUnitario as number | null | undefined) : undefined,
      note: body.note === null || typeof body.note === 'string' ? (body.note as string | null | undefined) : undefined,
    };

    await aggiornaRigaBom(identity.tenantId, id, input, {
      utenteId: identity.utenteId,
      membershipId: identity.membershipId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ErroreNonAutenticato) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    if (error instanceof ErroreAccessoNegato) {
      return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore aggiornamento riga BOM' },
      { status: 400 },
    );
  }
}
