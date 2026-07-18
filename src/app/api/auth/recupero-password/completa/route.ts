import { NextRequest, NextResponse } from 'next/server';
import { completaRecuperoPassword } from '@/server/services/recupero-password-service';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const token = typeof body.token === 'string' ? body.token : '';
  const nuovaPassword = typeof body.nuovaPassword === 'string' ? body.nuovaPassword : '';

  if (!token || !nuovaPassword) {
    return NextResponse.json({ errore: 'Dati mancanti.' }, { status: 400 });
  }

  const esito = await completaRecuperoPassword(token, nuovaPassword);
  if (!esito.successo) return NextResponse.json({ errore: esito.errore }, { status: 400 });

  return NextResponse.json({ successo: true });
}
