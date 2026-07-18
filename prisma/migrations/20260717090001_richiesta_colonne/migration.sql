-- Seconda parte della migrazione 20260717090000: separata dalla prima perché un
-- nuovo valore enum non può essere usato nella stessa transazione in cui è stato
-- aggiunto (vincolo PostgreSQL, non di Prisma). Prisma stesso genera due migrazioni
-- distinte in questo scenario.

ALTER TABLE "richiesta_progetto"
  ADD COLUMN "tokenRipresa" TEXT,
  ADD COLUMN "ultimoStepChiave" TEXT,
  ADD COLUMN "datiEstensione" JSONB,
  ALTER COLUMN "clienteNome" DROP NOT NULL,
  ALTER COLUMN "clienteEmail" DROP NOT NULL,
  ALTER COLUMN "datiFormJson" SET DEFAULT '{}',
  ALTER COLUMN "stato" SET DEFAULT 'BOZZA';

-- Popola tokenRipresa per eventuali righe esistenti (nessuna in questo ambiente di
-- sviluppo, ma corretto per idempotenza) prima di renderlo NOT NULL + UNIQUE.
UPDATE "richiesta_progetto" SET "tokenRipresa" = gen_random_uuid()::text WHERE "tokenRipresa" IS NULL;

ALTER TABLE "richiesta_progetto"
  ALTER COLUMN "tokenRipresa" SET NOT NULL;

CREATE UNIQUE INDEX "richiesta_progetto_tokenRipresa_key" ON "richiesta_progetto"("tokenRipresa");

ALTER TABLE "documento_richiesta"
  ADD COLUMN "categoria" "categoria_documento";

-- Nessuna riga esistente in documento_richiesta in questo ambiente; se ce ne fossero
-- andrebbero valorizzate prima di rendere la colonna NOT NULL.
ALTER TABLE "documento_richiesta"
  ALTER COLUMN "categoria" SET NOT NULL;
