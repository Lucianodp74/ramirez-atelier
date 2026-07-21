import { db } from '@/server/db';
import { Prisma } from '@prisma/client';

export type TipoEventoSicurezza =
  | 'LOGIN_RIUSCITO'
  | 'LOGIN_FALLITO'
  | 'LOGOUT'
  | 'CAMBIO_PASSWORD'
  | 'RECUPERO_PASSWORD_RICHIESTO'
  | 'RECUPERO_PASSWORD_COMPLETATO'
  | 'INVITO_CREATO'
  | 'INVITO_ACCETTATO'
  | 'CAMBIO_RUOLO'
  | 'CAMBIO_TENANT_ATTIVO'
  | 'SESSIONE_REVOCATA'
  | 'ACCESSO_NEGATO';

interface DatiEvento {
  tipo: TipoEventoSicurezza;
  tenantId?: string | null;
  utenteId?: string | null;
  membershipId?: string | null;
  metadati?: Record<string, unknown>;
  ipAddress?: string | null;
}

/** Unico punto che scrive nel registro di sicurezza - v. nota sullo scope in schema.prisma. */
export async function registraEventoSicurezza(dati: DatiEvento) {
  return db.eventoSicurezza.create({
    data: {
      tipo: dati.tipo,
      tenantId: dati.tenantId ?? null,
      utenteId: dati.utenteId ?? null,
      membershipId: dati.membershipId ?? null,
      metadatiJson: (dati.metadati as Prisma.InputJsonValue | undefined) ?? Prisma.JsonNull,
      ipAddress: dati.ipAddress ?? null,
    },
  });
}
