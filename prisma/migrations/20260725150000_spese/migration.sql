-- Sezione Spese (scope minimo): una voce di spesa mensile ricorrente.
-- Nessuna foreign key formale verso tenant, coerente con il pattern già
-- usato da finitura/ferramenta/accessorio - isolamento a livello
-- applicativo (ADR-0004), non tramite vincolo di database.

CREATE TABLE "spesa" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "importoMensile" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spesa_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "spesa_tenantId_idx" ON "spesa"("tenantId");
