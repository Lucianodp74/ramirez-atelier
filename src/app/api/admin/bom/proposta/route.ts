import { NextResponse } from 'next/server';
import { richiediContesto, ErroreAccessoNegato, ErroreNonAutenticato } from '@/server/identity/contesto';
import { generaPropostaBom } from '@/server/services/bom-service';
import { haPermesso } from '@/server/services/permission-service';
import { registraEventoSicurezza } from '@/server/services/sicurezza-eventi-service';

async function contestoGenerazioneBom() {
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
    const identity = await contestoGenerazioneBom();
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
