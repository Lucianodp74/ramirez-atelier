-- Migrazione iniziale, generata manualmente a partire da prisma/schema.prisma
-- a causa dell'impossibilità di raggiungere binaries.prisma.sh da questo ambiente
-- di sviluppo (dominio non incluso nella whitelist di rete del sandbox). Verificata
-- applicandola direttamente a un'istanza reale di PostgreSQL 16.
--
-- Nell'ambiente di sviluppo/CI reale del progetto, questa migrazione verrà
-- rigenerata automaticamente da `prisma migrate dev` la prima volta che verrà
-- eseguito con accesso di rete normale - a quel punto questo file può essere
-- sostituito dall'output ufficiale del CLI (dovrebbe risultare equivalente).

CREATE TYPE "cliente_tipo" AS ENUM ('PRIVATO', 'ARCHITETTO', 'IMPRESA', 'STUDIO_TECNICO');
CREATE TYPE "stato_richiesta" AS ENUM ('NUOVA', 'IN_REVISIONE', 'CONVERTITA', 'ARCHIVIATA');

CREATE TABLE "tipo_progetto" (
    "id" TEXT NOT NULL,
    "chiave" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "immagineCopertina" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "ordinamento" INTEGER NOT NULL DEFAULT 0,
    "configurazione" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "tipo_progetto_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "tipo_progetto_chiave_key" ON "tipo_progetto"("chiave");

CREATE TABLE "richiesta_progetto" (
    "id" TEXT NOT NULL,
    "tipoProgettoId" TEXT NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "clienteEmail" TEXT NOT NULL,
    "clienteTelefono" TEXT,
    "clienteTipo" "cliente_tipo" NOT NULL DEFAULT 'PRIVATO',
    "clienteAzienda" TEXT,
    "datiFormJson" JSONB NOT NULL,
    "budgetDichiarato" TEXT,
    "dataDesiderata" TIMESTAMP(3),
    "messaggioLibero" TEXT,
    "indiceCompletezza" INTEGER NOT NULL DEFAULT 0,
    "fasciaPrezzoMin" DECIMAL(12,2),
    "fasciaPrezzoMax" DECIMAL(12,2),
    "regolaPrezzoApplicataId" TEXT,
    "stato" "stato_richiesta" NOT NULL DEFAULT 'NUOVA',
    "noteInterne" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "richiesta_progetto_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "richiesta_progetto_stato_idx" ON "richiesta_progetto"("stato");
CREATE INDEX "richiesta_progetto_tipoProgettoId_idx" ON "richiesta_progetto"("tipoProgettoId");
CREATE INDEX "richiesta_progetto_createdAt_idx" ON "richiesta_progetto"("createdAt");

CREATE TABLE "documento_richiesta" (
    "id" TEXT NOT NULL,
    "richiestaId" TEXT NOT NULL,
    "nomeFileOriginale" TEXT NOT NULL,
    "tipoMime" TEXT NOT NULL,
    "storageObjectKey" TEXT NOT NULL,
    "dimensioneByte" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documento_richiesta_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "documento_richiesta_richiestaId_idx" ON "documento_richiesta"("richiestaId");

CREATE TABLE "regola_prezzo" (
    "id" TEXT NOT NULL,
    "tipoProgettoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "condizioni" JSONB NOT NULL,
    "prezzoMin" DECIMAL(12,2) NOT NULL,
    "prezzoMax" DECIMAL(12,2) NOT NULL,
    "priorita" INTEGER NOT NULL DEFAULT 0,
    "attiva" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "regola_prezzo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "regola_prezzo_tipoProgettoId_attiva_idx" ON "regola_prezzo"("tipoProgettoId", "attiva");

ALTER TABLE "richiesta_progetto" ADD CONSTRAINT "richiesta_progetto_tipoProgettoId_fkey"
    FOREIGN KEY ("tipoProgettoId") REFERENCES "tipo_progetto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "documento_richiesta" ADD CONSTRAINT "documento_richiesta_richiestaId_fkey"
    FOREIGN KEY ("richiestaId") REFERENCES "richiesta_progetto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "regola_prezzo" ADD CONSTRAINT "regola_prezzo_tipoProgettoId_fkey"
    FOREIGN KEY ("tipoProgettoId") REFERENCES "tipo_progetto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
