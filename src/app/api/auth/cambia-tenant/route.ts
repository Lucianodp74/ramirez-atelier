import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cambiaTenantAttivo } from '@/server/services/auth-service';
import { NOME_COOKIE_SESSIONE } from '@/server/identity/contesto';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_COOKIE_SESSIONE)?.value;
  if (!token) return NextResponse.json({ errore: 'Non autenticato.' }, { status: 401 });

  const body = await request.json();
  const nuovoTenantId = typeof body.tenantId === 'string' ? body.tenantId : '';
  if (!nuovoTenantId) return NextResponse.json({ errore: 'tenantId mancante.' }, { status: 400 });

  const esito = await cambiaTenantAttivo(token, nuovoTenantId);
  if (!esito.successo) return NextResponse.json({ errore: esito.errore }, { status: 403 });

  return NextResponse.json({ successo: true });
}
