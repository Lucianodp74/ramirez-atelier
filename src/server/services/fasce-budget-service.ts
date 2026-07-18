import { db } from '@/server/db';

export async function elencoFasceBudget(tenantId: string) {
  return db.fasciaBudget.findMany({ where: { tenantId }, orderBy: { ordinamento: 'asc' } });
}

export async function elencoFasceBudgetAttive(tenantId: string) {
  return db.fasciaBudget.findMany({
    where: { tenantId, attiva: true },
    orderBy: { ordinamento: 'asc' },
  });
}

export interface DatiFasciaBudget {
  nome: string;
  minimo: number;
  massimo: number | null;
  ordinamento: number;
}

export async function creaFasciaBudget(tenantId: string, dati: DatiFasciaBudget) {
  return db.fasciaBudget.create({ data: { ...dati, tenantId } });
}

export async function aggiornaFasciaBudget(
  tenantId: string,
  id: string,
  dati: Partial<DatiFasciaBudget>,
) {
  const fascia = await db.fasciaBudget.findUnique({ where: { id } });
  if (!fascia || fascia.tenantId !== tenantId) throw new Error('Fascia di budget non trovata.');
  return db.fasciaBudget.update({ where: { id }, data: dati });
}

export async function impostaAttivaFasciaBudget(tenantId: string, id: string, attiva: boolean) {
  const fascia = await db.fasciaBudget.findUnique({ where: { id } });
  if (!fascia || fascia.tenantId !== tenantId) throw new Error('Fascia di budget non trovata.');
  return db.fasciaBudget.update({ where: { id }, data: { attiva } });
}
