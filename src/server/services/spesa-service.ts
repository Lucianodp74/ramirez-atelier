import { db } from '@/server/db';

export async function elencoSpese(tenantId: string) {
  return db.spesa.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'asc' },
  });
}

/** Somma delle spese mensili - calcolata qui, non lasciata al front-end,
 * per avere un solo punto di verità sul totale (coerente con il resto del
 * progetto: il calcolo vive nel servizio, non duplicato altrove). */
export async function totaleSpeseMensili(tenantId: string): Promise<number> {
  const spese = await elencoSpese(tenantId);
  return spese.reduce((somma, s) => somma + Number(s.importoMensile), 0);
}

export async function creaSpesa(tenantId: string, nome: string, importoMensile: number) {
  return db.spesa.create({
    data: { tenantId, nome, importoMensile },
  });
}

export async function aggiornaSpesa(
  tenantId: string,
  id: string,
  nome: string,
  importoMensile: number,
) {
  const esistente = await db.spesa.findUnique({ where: { id } });
  if (!esistente || esistente.tenantId !== tenantId) throw new Error('Spesa non trovata.');

  return db.spesa.update({
    where: { id },
    data: { nome, importoMensile },
  });
}

export async function eliminaSpesa(tenantId: string, id: string) {
  const esistente = await db.spesa.findUnique({ where: { id } });
  if (!esistente || esistente.tenantId !== tenantId) throw new Error('Spesa non trovata.');

  return db.spesa.delete({ where: { id } });
}
