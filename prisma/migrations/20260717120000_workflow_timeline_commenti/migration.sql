-- Incremento 3: workflow di stato esteso (Nuova → In revisione → Preventivo
-- inviato → Convertita → Chiusa), Activity Timeline, commenti interni.
--
-- Verificata applicandola direttamente a PostgreSQL 16 reale, per lo stesso
-- motivo documentato nelle migrazioni precedenti (binaries.prisma.sh non
-- raggiungibile da questo ambiente di sviluppo).

-- Sostituzione del tipo enum: PostgreSQL non supporta la rimozione diretta di un
-- valore enum (solo l'aggiunta), quindi si ricrea il tipo. Sicuro qui perché la
-- tabella richiesta_progetto non contiene ancora righe con stato = 'ARCHIVIATA'
-- in questo ambiente di sviluppo (verificato prima di eseguire la migrazione).
ALTER TYPE "stato_richiesta" RENAME TO "stato_richiesta_old";

CREATE TYPE "stato_richiesta" AS ENUM ('BOZZA', 'NUOVA', 'IN_REVISIONE', 'PREVENTIVO_INVIATO', 'CONVERTITA', 'CHIUSA');

ALTER TABLE "richiesta_progetto" ALTER COLUMN "stato" DROP DEFAULT;
ALTER TABLE "richiesta_progetto" ALTER COLUMN "stato" TYPE "stato_richiesta" USING ("stato"::text::"stato_richiesta");
ALTER TABLE "richiesta_progetto" ALTER COLUMN "stato" SET DEFAULT 'BOZZA';

DROP TYPE "stato_richiesta_old";

CREATE TYPE "tipo_evento_attivita" AS ENUM (
  'RICHIESTA_CREATA', 'STEP_COMPLETATO', 'DOCUMENTO_CARICATO', 'DOCUMENTO_RIMOSSO',
  'STATO_MODIFICATO', 'RICHIESTA_COMPLETATA', 'COMMENTO_INSERITO'
);

CREATE TYPE "attore_evento" AS ENUM ('CLIENTE', 'TITOLARE', 'SISTEMA');

CREATE TABLE "evento_attivita" (
    "id" TEXT NOT NULL,
    "richiestaId" TEXT NOT NULL,
    "tipo" "tipo_evento_attivita" NOT NULL,
    "descrizione" TEXT NOT NULL,
    "metadatiJson" JSONB,
    "attore" "attore_evento" NOT NULL DEFAULT 'SISTEMA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "evento_attivita_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "evento_attivita_richiestaId_createdAt_idx" ON "evento_attivita"("richiestaId", "createdAt");
ALTER TABLE "evento_attivita" ADD CONSTRAINT "evento_attivita_richiestaId_fkey"
    FOREIGN KEY ("richiestaId") REFERENCES "richiesta_progetto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "commento_interno" (
    "id" TEXT NOT NULL,
    "richiestaId" TEXT NOT NULL,
    "testo" TEXT NOT NULL,
    "autore" TEXT NOT NULL DEFAULT 'Titolare',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "commento_interno_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "commento_interno_richiestaId_createdAt_idx" ON "commento_interno"("richiestaId", "createdAt");
ALTER TABLE "commento_interno" ADD CONSTRAINT "commento_interno_richiestaId_fkey"
    FOREIGN KEY ("richiestaId") REFERENCES "richiesta_progetto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
