-- Uniformo i timestamp di creazione a "createdAt" in tutto lo schema.
-- Trovata durante la Pre-Flight Review prima di Supabase: alcuni modelli
-- usavano nomi italiani (creataIl, creatoIl, eseguitaIl, assegnatoIl) per lo
-- stesso identico concetto che altrove si chiama "createdAt" - nessuna
-- differenza di significato, solo un'incoerenza di convenzione. Corretta ora,
-- il momento più economico per farlo: prima che esista un solo dato reale
-- su un database di produzione persistente.
--
-- Non toccati: "scadeIl" e "revocataIl" su Sessione - hanno un significato di
-- dominio distinto da "quando è stata creata la riga" (quando scade, quando è
-- stata revocata), non sono la stessa incoerenza.

ALTER TABLE "esecuzione_regola" RENAME COLUMN "eseguitaIl" TO "createdAt";
ALTER INDEX "esecuzione_regola_entitaTipo_entitaId_eseguitaIl_idx" RENAME TO "esecuzione_regola_entitaTipo_entitaId_createdAt_idx";
ALTER INDEX "esecuzione_regola_regolaId_eseguitaIl_idx" RENAME TO "esecuzione_regola_regolaId_createdAt_idx";

ALTER TABLE "membership_ruolo" RENAME COLUMN "assegnatoIl" TO "createdAt";

ALTER TABLE "sessione" RENAME COLUMN "creataIl" TO "createdAt";

ALTER TABLE "evento_sicurezza" RENAME COLUMN "creatoIl" TO "createdAt";
ALTER INDEX "evento_sicurezza_tipo_creatoIl_idx" RENAME TO "evento_sicurezza_tipo_createdAt_idx";
ALTER INDEX "evento_sicurezza_utenteId_creatoIl_idx" RENAME TO "evento_sicurezza_utenteId_createdAt_idx";
ALTER INDEX "evento_sicurezza_tenantId_creatoIl_idx" RENAME TO "evento_sicurezza_tenantId_createdAt_idx";
