import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logout } from '@/server/services/auth-service';
import { NOME_COOKIE_SESSIONE } from '@/server/identity/contesto';

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get(NOME_COOKIE_SESSIONE)?.value;

  if (token) {
    await logout(token); // revoca la Sessione lato server - non basta cancellare il cookie
  }

  cookieStore.delete(NOME_COOKIE_SESSIONE);

  return NextResponse.json({ successo: true });
}
