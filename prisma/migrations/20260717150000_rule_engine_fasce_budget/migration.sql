-- Incremento 4: Business Rules Engine generico + fasce di budget configurabili.
-- Verificata applicandola direttamente a PostgreSQL 16 reale (stesso motivo delle
-- migrazioni precedenti: binaries.prisma.sh non raggiungibile da questo ambiente).

CREATE TYPE "priorita_commerciale" AS ENUM ('BASSA', 'MEDIA', 'ALTA');
CREATE TYPE "stato_regola" AS ENUM ('ATTIVA', 'DISATTIVA');
CREATE TYPE "esito_esecuzione_regola" AS ENUM ('CONDIZIONE_VERA', 'CONDIZIONE_FALSA', 'ERRORE');

CREATE TABLE "fascia_budget" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "minimo" DECIMAL(12,2) NOT NULL,
    "massimo" DECIMAL(12,2),
    "ordinamento" INTEGER NOT NULL DEFAULT 0,
    "attiva" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "fascia_budget_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "fascia_budget_attiva_ordinamento_idx" ON "fascia_budget"("attiva", "ordinamento");

CREATE TABLE "regola" (
    "id" TEXT NOT NULL,
    "contesto" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "stato" "stato_regola" NOT NULL DEFAULT 'ATTIVA',
    "priorita" INTEGER NOT NULL DEFAULT 0,
    "condizioni" JSONB NOT NULL,
    "azioni" JSONB NOT NULL,
    "versione" INTEGER NOT NULL DEFAULT 1,
    "validoDa" TIMESTAMP(3),
    "validoA" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "regola_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "regola_contesto_stato_priorita_idx" ON "regola"("contesto", "stato", "priorita");

CREATE TABLE "esecuzione_regola" (
    "id" TEXT NOT NULL,
    "regolaId" TEXT NOT NULL,
    "entitaTipo" TEXT NOT NULL,
    "entitaId" TEXT NOT NULL,
    "esito" "esito_esecuzione_regola" NOT NULL,
    "risultatoJson" JSONB,
    "erroreMessaggio" TEXT,
    "eseguitaIl" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "esecuzione_regola_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "esecuzione_regola_entitaTipo_entitaId_eseguitaIl_idx" ON "esecuzione_regola"("entitaTipo", "entitaId", "eseguitaIl");
CREATE INDEX "esecuzione_regola_regolaId_eseguitaIl_idx" ON "esecuzione_regola"("regolaId", "eseguitaIl");
ALTER TABLE "esecuzione_regola" ADD CONSTRAINT "esecuzione_regola_regolaId_fkey"
    FOREIGN KEY ("regolaId") REFERENCES "regola"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "richiesta_progetto"
    ADD COLUMN "fasciaBudgetId" TEXT,
    ADD COLUMN "prioritaCommerciale" "priorita_commerciale";
ALTER TABLE "richiesta_progetto" ADD CONSTRAINT "richiesta_progetto_fasciaBudgetId_fkey"
    FOREIGN KEY ("fasciaBudgetId") REFERENCES "fascia_budget"("id") ON DELETE SET NULL ON UPDATE CASCADE;
