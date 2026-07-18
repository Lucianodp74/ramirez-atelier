import { NextResponse } from 'next/server';
import { contestoOpzionale } from '@/server/identity/contesto';
import { db } from '@/server/db';

export async function GET() {
  const contesto = await contestoOpzionale();
  if (!contesto) return NextResponse.json({ autenticato: false }, { status: 401 });

  const tenant = await db.tenant.findUnique({ where: { id: contesto.tenantId } });

  return NextResponse.json({
    autenticato: true,
    utente: { id: contesto.utenteId, nome: contesto.utenteNome },
    tenant: { id: contesto.tenantId, nome: tenant?.nome },
  });
}
