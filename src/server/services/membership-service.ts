import { db } from '@/server/db';
import { registraEventoSicurezza } from './sicurezza-eventi-service';

/** Invariante ADR §5: al più una Membership attiva per coppia Utente/Tenant (garantito anche da vincolo UNIQUE a livello DB). */
export async function creaMembership(utenteId: string, tenantId: string, ruoloId: string) {
  const esistente = await db.membership.findMany({ where: { utenteId, tenantId } });
  if (esistente.length > 0) {
    throw new Error('Esiste già una Membership tra questo utente e questo Tenant.');
  }

  const membership = await db.membership.create({ data: { utenteId, tenantId, stato: 'ATTIVA' } });
  await db.membershipRuolo.create({ data: { membershipId: membership.id, ruoloId } });

  return membership;
}

export async function sospendiMembership(membershipId: string) {
  return db.membership.update({ where: { id: membershipId }, data: { stato: 'SOSPESA' } });
}

export async function riattivaMembership(membershipId: string) {
  return db.membership.update({ where: { id: membershipId }, data: { stato: 'ATTIVA' } });
}

export async function revocaMembership(membershipId: string) {
  const membership = await db.membership.update({
    where: { id: membershipId },
    data: { stato: 'REVOCATA' },
  });

  // Una Membership revocata invalida immediatamente ogni sessione che la usa
  // come Tenant attivo - non basta cambiare lo stato della Membership, le
  // sessioni già emesse resterebbero valide finché non scadono naturalmente.
  const sessioniAttive = await db.sessione.findMany({
    where: { utenteId: membership.utenteId, stato: 'ATTIVA' },
  });
  for (const sessione of sessioniAttive) {
    if (sessione.membershipId === membershipId) {
      await db.sessione.update({
        where: { id: sessione.id },
        data: { stato: 'REVOCATA', revocataIl: new Date() },
      });
    }
  }

  await registraEventoSicurezza({
    tipo: 'CAMBIO_RUOLO',
    utenteId: membership.utenteId,
    tenantId: membership.tenantId,
    membershipId,
    metadati: { azione: 'membership_revocata' },
  });

  return membership;
}

export async function membershipDiUtente(utenteId: string) {
  return db.membership.findMany({ where: { utenteId }, include: { tenant: true, ruoli: true } });
}

export async function membershipDiTenant(tenantId: string) {
  return db.membership.findMany({
    where: { tenantId },
    include: { utente: true, ruoli: { include: { ruolo: true } } },
  });
}
