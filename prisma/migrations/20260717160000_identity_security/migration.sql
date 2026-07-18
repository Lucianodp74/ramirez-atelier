-- Incremento 5: Identity & Security (ADR-0004 v1.1).
-- Verificata applicandola direttamente a PostgreSQL 16 reale (stesso motivo
-- delle migrazioni precedenti: binaries.prisma.sh non raggiungibile qui).
--
-- Ordine importante: prima si crea Tenant e si inserisce il Tenant "Ramirez
-- Atelier" (id fisso, noto), poi si aggiungono le tabelle di identità, poi si
-- retro-popola tenantId sulle tabelle di business già esistenti (che oggi
-- hanno dati reali) prima di renderlo NOT NULL.

CREATE TABLE "tenant" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'ATTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tenant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tenant_slug_key" ON "tenant"("slug");

-- Tenant iniziale con id fisso e noto, referenziato dal resto della migrazione.
INSERT INTO "tenant" (id, nome, slug, stato, "updatedAt")
VALUES ('tenant_ramirez_atelier', 'Ramirez Atelier', 'ramirez-atelier', 'ATTIVO', now());

CREATE TABLE "utente" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "algoritmoHash" TEXT NOT NULL DEFAULT 'argon2id',
    "stato" TEXT NOT NULL DEFAULT 'ATTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "utente_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "utente_email_key" ON "utente"("email");
CREATE INDEX "utente_stato_idx" ON "utente"("stato");

CREATE TABLE "membership" (
    "id" TEXT NOT NULL,
    "utenteId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'ATTIVA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "membership_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "membership_utenteId_tenantId_key" ON "membership"("utenteId", "tenantId");
CREATE INDEX "membership_tenantId_stato_idx" ON "membership"("tenantId", "stato");
ALTER TABLE "membership" ADD CONSTRAINT "membership_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "utente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "membership" ADD CONSTRAINT "membership_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "ruolo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "templateSistema" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ruolo_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ruolo_tenantId_nome_key" ON "ruolo"("tenantId", "nome");
ALTER TABLE "ruolo" ADD CONSTRAINT "ruolo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "membership_ruolo" (
    "membershipId" TEXT NOT NULL,
    "ruoloId" TEXT NOT NULL,
    "assegnatoIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "membership_ruolo_pkey" PRIMARY KEY ("membershipId", "ruoloId")
);
ALTER TABLE "membership_ruolo" ADD CONSTRAINT "membership_ruolo_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "membership_ruolo" ADD CONSTRAINT "membership_ruolo_ruoloId_fkey" FOREIGN KEY ("ruoloId") REFERENCES "ruolo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "permesso" (
    "id" TEXT NOT NULL,
    "ruoloId" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "azione" TEXT NOT NULL,
    "ambitoJson" JSONB,
    CONSTRAINT "permesso_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "permesso_ruoloId_modulo_azione_key" ON "permesso"("ruoloId", "modulo", "azione");
ALTER TABLE "permesso" ADD CONSTRAINT "permesso_ruoloId_fkey" FOREIGN KEY ("ruoloId") REFERENCES "ruolo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "sessione" (
    "id" TEXT NOT NULL,
    "utenteId" TEXT NOT NULL,
    "membershipId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'ATTIVA',
    "creataIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scadeIl" TIMESTAMP(3) NOT NULL,
    "revocataIl" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "sessione_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "sessione_tokenHash_key" ON "sessione"("tokenHash");
CREATE INDEX "sessione_utenteId_stato_idx" ON "sessione"("utenteId", "stato");
CREATE INDEX "sessione_tokenHash_idx" ON "sessione"("tokenHash");
ALTER TABLE "sessione" ADD CONSTRAINT "sessione_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "utente"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sessione" ADD CONSTRAINT "sessione_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "membership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "invito" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ruoloIniziale" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "stato" TEXT NOT NULL DEFAULT 'CREATO',
    "creatoDaUtenteId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scadeIl" TIMESTAMP(3) NOT NULL,
    "accettatoIl" TIMESTAMP(3),
    CONSTRAINT "invito_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "invito_tokenHash_key" ON "invito"("tokenHash");
CREATE INDEX "invito_tenantId_stato_idx" ON "invito"("tenantId", "stato");
ALTER TABLE "invito" ADD CONSTRAINT "invito_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "richiesta_recupero_password" (
    "id" TEXT NOT NULL,
    "utenteId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "scadeIl" TIMESTAMP(3) NOT NULL,
    "usataIl" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "richiesta_recupero_password_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "richiesta_recupero_password_tokenHash_key" ON "richiesta_recupero_password"("tokenHash");
CREATE INDEX "richiesta_recupero_password_utenteId_idx" ON "richiesta_recupero_password"("utenteId");
ALTER TABLE "richiesta_recupero_password" ADD CONSTRAINT "richiesta_recupero_password_utenteId_fkey" FOREIGN KEY ("utenteId") REFERENCES "utente"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "evento_sicurezza" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "tenantId" TEXT,
    "utenteId" TEXT,
    "membershipId" TEXT,
    "metadatiJson" JSONB,
    "ipAddress" TEXT,
    "creatoIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evento_sicurezza_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "evento_sicurezza_tipo_creatoIl_idx" ON "evento_sicurezza"("tipo", "creatoIl");
CREATE INDEX "evento_sicurezza_utenteId_creatoIl_idx" ON "evento_sicurezza"("utenteId", "creatoIl");
CREATE INDEX "evento_sicurezza_tenantId_creatoIl_idx" ON "evento_sicurezza"("tenantId", "creatoIl");

-- ===================================================================
-- tenantId retroattivo sulle tabelle di business esistenti
-- ===================================================================

ALTER TABLE "tipo_progetto" ADD COLUMN "tenantId" TEXT;
UPDATE "tipo_progetto" SET "tenantId" = 'tenant_ramirez_atelier' WHERE "tenantId" IS NULL;
ALTER TABLE "tipo_progetto" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "tipo_progetto_chiave_key";
CREATE UNIQUE INDEX "tipo_progetto_tenantId_chiave_key" ON "tipo_progetto"("tenantId", "chiave");
ALTER TABLE "tipo_progetto" ADD CONSTRAINT "tipo_progetto_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "richiesta_progetto" ADD COLUMN "tenantId" TEXT;
UPDATE "richiesta_progetto" SET "tenantId" = 'tenant_ramirez_atelier' WHERE "tenantId" IS NULL;
ALTER TABLE "richiesta_progetto" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "richiesta_progetto_stato_idx";
CREATE INDEX "richiesta_progetto_tenantId_stato_idx" ON "richiesta_progetto"("tenantId", "stato");
ALTER TABLE "richiesta_progetto" ADD CONSTRAINT "richiesta_progetto_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "regola_prezzo" ADD COLUMN "tenantId" TEXT;
UPDATE "regola_prezzo" SET "tenantId" = 'tenant_ramirez_atelier' WHERE "tenantId" IS NULL;
ALTER TABLE "regola_prezzo" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "regola_prezzo" ADD CONSTRAINT "regola_prezzo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fascia_budget" ADD COLUMN "tenantId" TEXT;
UPDATE "fascia_budget" SET "tenantId" = 'tenant_ramirez_atelier' WHERE "tenantId" IS NULL;
ALTER TABLE "fascia_budget" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "fascia_budget_attiva_ordinamento_idx";
CREATE INDEX "fascia_budget_tenantId_attiva_ordinamento_idx" ON "fascia_budget"("tenantId", "attiva", "ordinamento");
ALTER TABLE "fascia_budget" ADD CONSTRAINT "fascia_budget_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "regola" ADD COLUMN "tenantId" TEXT;
UPDATE "regola" SET "tenantId" = 'tenant_ramirez_atelier' WHERE "tenantId" IS NULL;
ALTER TABLE "regola" ALTER COLUMN "tenantId" SET NOT NULL;
DROP INDEX IF EXISTS "regola_contesto_stato_priorita_idx";
CREATE INDEX "regola_tenantId_contesto_stato_priorita_idx" ON "regola"("tenantId", "contesto", "stato", "priorita");
ALTER TABLE "regola" ADD CONSTRAINT "regola_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
