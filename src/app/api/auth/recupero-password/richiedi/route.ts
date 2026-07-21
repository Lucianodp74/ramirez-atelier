import { NextRequest, NextResponse } from 'next/server';
import { richiediRecuperoPassword } from '@/server/services/recupero-password-service';
import { getEmailAdapter } from '@/lib/notifiche';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = typeof body.email === 'string' ? body.email : '';

  if (email) {
    const risultato = await richiediRecuperoPassword(email);
    if (risultato) {
      const link = `${process.env.SITE_URL}/admin/recupera-password/${risultato.tokenGrezzo}`;
      await getEmailAdapter().invia({
        destinatario: email,
        oggetto: 'Recupero password — Ramirez Atelier',
        corpo: `Hai richiesto di reimpostare la password.\n\nApri questo link entro 30 minuti:\n${link}\n\nSe non hai richiesto tu questo, ignora questa email: nessuna modifica sarà effettuata.`,
      });
    }
  }

  // Risposta sempre identica, indipendentemente dal fatto che l'email esista
  // (ADR-0004 §9: non rivelare quali indirizzi sono registrati).
  return NextResponse.json({
    messaggio: "Se l'indirizzo è registrato, riceverai a breve un'email con le istruzioni.",
  });
}
