import { NextRequest, NextResponse } from 'next/server';
import { richiediRecuperoPassword } from '@/server/services/recupero-password-service';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email : '';

  if (email) {
    await richiediRecuperoPassword(email);
  }

  // Risposta sempre identica, indipendentemente dal fatto che l'email esista
  // (ADR-0004 §9: non rivelare quali indirizzi sono registrati). L'invio reale
  // del link via email non è ancora integrato in questo incremento - v. README.
  return NextResponse.json({
    messaggio: "Se l'indirizzo è registrato, riceverai a breve un'email con le istruzioni.",
  });
}
