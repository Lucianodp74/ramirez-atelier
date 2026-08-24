import { db } from '@/server/db';
import {
  aggiungiRigaBom,
  cambiaStatoBom,
  creaBom,
  dettaglioBom,
  type CreaBomInput,
  type CreaBomRigaInput,
  type StatoBom,
} from '@/server/services/bom-service';

export async function listaBomAdmin(tenantId: string) {
  return db.$queryRaw<
    Array<{
      id: string;
      richiestaId: string;
      stato: StatoBom;
      versione: number;
      noteProduzione: string | null;
      createdAt: Date;
      updatedAt: Date;
      righeCount: number;
    }>
  >`
    SELECT b."id", b."richiestaId", b."stato", b."versione", b."noteProduzione",
           b."createdAt", b."updatedAt", COUNT(br."id")::int AS "righeCount"
    FROM "bom" b
    LEFT JOIN "bom_riga" br ON br."bomId" = b."id"
    WHERE b."tenantId" = ${tenantId}
    GROUP BY b."id"
    ORDER BY b."updatedAt" DESC
  `;
}

export async function creaBomAdmin(tenantId: string, input: CreaBomInput) {
  return creaBom(tenantId, input);
}

export async function dettaglioBomAdmin(tenantId: string, bomId: string) {
  return dettaglioBom(tenantId, bomId);
}

export async function aggiungiRigaBomAdmin(
  tenantId: string,
  bomId: string,
  input: CreaBomRigaInput,
) {
  return aggiungiRigaBom(tenantId, bomId, input);
}

export async function cambiaStatoBomAdmin(
  tenantId: string,
  bomId: string,
  stato: StatoBom,
) {
  return cambiaStatoBom(tenantId, bomId, stato);
}

export async function eliminaRigaBomAdmin(
  tenantId: string,
  bomId: string,
  rigaId: string,
) {
  const result = await db.$executeRaw`
    DELETE FROM "bom_riga" br
    USING "bom" b
    WHERE br."id" = ${rigaId}
      AND br."bomId" = b."id"
      AND b."id" = ${bomId}
      AND b."tenantId" = ${tenantId}
      AND b."stato" = 'BOZZA'
  `;
  if (result === 0) {
    throw new Error('Riga non trovata o distinta non modificabile.');
  }
}
