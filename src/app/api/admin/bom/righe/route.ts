import { NextResponse } from 'next/server';
import { aggiungiRigaBom, dettaglioBom } from '@/server/services/bom-service';
import type { CreaBomRigaInput } from '@/server/services/bom-service';
import { ErroreAccessoNegato, ErroreNonAutenticato, richiediContesto } from '@/server/identity/contesto';
import { haPermesso } from '@/server/services/permission-service';
import { registraEventoSicurezza } from '@/server/services/sicurezza-eventi-service';

async function contestoGestioneBom() {
  const identity = await richiediContesto();
  const [puoGestireRichieste, puoGestireCatalogo] = await Promise.all([
    haPermesso(identity.membershipId, 'richieste', 'gestisci'),
    haPermesso(identity.membershipId, 'catalogo', 'gestisci'),
  ]);

  if (!puoGestireRichieste && !puoGestireCatalogo) {
    await registraEventoSicurezza({
      tipo: 'ACCESSO_NEGATO',
      utenteId: identity.utenteId,
      tenantId: identity.tenantId,
      membershipId: identity.membershipId,
      metadati: {
        modulo: 'bom',
        azione: 'gestisci',
        permessiRichiesti: ['richieste.gestisci', 'catalogo.gestisci'],
      },
    });
    throw new ErroreAccessoNegato('bom', 'gestisci');
  }

  return identity;
}

export async function POST(request: Request) {
  try {
    const identity = await contestoGestioneBom();
    const body = (await request.json()) as Partial<CreaBomRigaInput> & {
      bomId?: unknown;
    };
    if (typeof body.bomId !== 'string' || !body.bomId) {
      return NextResponse.json({ error: 'bomId obbligatorio' }, { status: 400 });
    }
    if (typeof body.categoria !== 'string' || !body.categoria) {
      return NextResponse.json({ error: 'categoria obbligatoria' }, { status: 400 });
    }
    if (typeof body.descrizione !== 'string' || !body.descrizione) {
      return NextResponse.json({ error: 'descrizione obbligatoria' }, { status: 400 });
    }
    if (typeof body.quantita !== 'number') {
      return NextResponse.json({ error: 'quantita obbligatoria' }, { status: 400 });
    }

    const id = await aggiungiRigaBom(identity.tenantId, body.bomId, {
      categoria: body.categoria,
      codice: body.codice ?? null,
      descrizione: body.descrizione,
      unita: body.unita ?? 'pz',
      quantita: body.quantita,
      materiale: body.materiale ?? null,
      lavorazione: body.lavorazione ?? null,
      costoUnitario: body.costoUnitario ?? null,
      note: body.note ?? null,
      ordinamento: body.ordinamento ?? 0,
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof ErroreNonAutenticato) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    if (error instanceof ErroreAccessoNegato) {
      return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Errore riga BOM' },
      { status: 400 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const identity = await richiediContesto({ modulo: 'richieste', azione: 'leggi' });
    const bomId = new URL(request.url).searchParams.get('bomId');
    if (!bomId) {
      return NextResponse.json({ error: 'bomId obbligatorio' }, { status: 400 });
    }
    const bom = await dettaglioBom(identity.tenantId, bomId);
    if (!bom) {
      return NextResponse.json({ error: 'Distinta non trovata' }, { status: 404 });
    }
    return NextResponse.json({ righe: bom.righe });
  } catch (error) {
    if (error instanceof ErroreNonAutenticato) {
      return NextResponse.json({ error: 'Non autenticato' }, { status: 401 });
    }
    if (error instanceof ErroreAccessoNegato) {
      return NextResponse.json({ error: 'Permesso negato' }, { status: 403 });
    }
    throw error;
  }
}
