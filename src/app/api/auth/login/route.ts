import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { login } from '@/server/services/auth-service';
import { NOME_COOKIE_SESSIONE } from '@/server/identity/contesto';

const DURATA_COOKIE_SECONDI = 60 * 60 * 24 * 7; // 7 giorni, coerente con la durata della Sessione

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!email || !password) {
    return NextResponse.json({ errore: 'Email e password sono obbligatorie.' }, { status: 400 });
  }

  const esito = await login(email, password, {
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
  });

  if (!esito.successo || !esito.tokenSessione) {
    // Stesso messaggio generico sia per email inesistente sia per password
    // errata (ADR-0004 §9: non facilitare l'enumerazione di account).
    return NextResponse.json({ errore: esito.errore ?? 'Accesso non riuscito.' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(NOME_COOKIE_SESSIONE, esito.tokenSessione, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DURATA_COOKIE_SECONDI,
    path: '/',
  });

  return NextResponse.json({ successo: true });
}
