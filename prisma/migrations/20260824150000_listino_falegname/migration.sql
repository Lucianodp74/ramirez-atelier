CREATE TABLE "listino_prezzo" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "categoria" TEXT NOT NULL,
  "codice" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "descrizione" TEXT,
  "unita" TEXT NOT NULL,
  "prezzo" DECIMAL(12,2) NOT NULL,
  "attivo" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "listino_prezzo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "listino_prezzo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "listino_prezzo_tenantId_codice_key" ON "listino_prezzo"("tenantId", "codice");
CREATE INDEX "listino_prezzo_tenantId_attivo_categoria_idx" ON "listino_prezzo"("tenantId", "attivo", "categoria");

CREATE TABLE "listino_prezzo_storico" (
  "id" TEXT NOT NULL,
  "listinoPrezzoId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "prezzoPrecedente" DECIMAL(12,2) NOT NULL,
  "prezzoNuovo" DECIMAL(12,2) NOT NULL,
  "motivo" TEXT,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "listino_prezzo_storico_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "listino_prezzo_storico_prezzo_fkey" FOREIGN KEY ("listinoPrezzoId") REFERENCES "listino_prezzo"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "listino_prezzo_storico_tenant_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "listino_prezzo_storico_tenantId_listinoPrezzoId_changedAt_idx" ON "listino_prezzo_storico"("tenantId", "listinoPrezzoId", "changedAt");
