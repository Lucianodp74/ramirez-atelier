-- RAMIREZ OS BOM foundation
-- Safe additive migration: creates only new tables/indexes and does not alter existing data.

CREATE TABLE "bom" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "richiestaId" TEXT NOT NULL,
  "stato" TEXT NOT NULL DEFAULT 'BOZZA',
  "versione" INTEGER NOT NULL DEFAULT 1,
  "noteProduzione" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bom_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bom_stato_check" CHECK ("stato" IN ('BOZZA', 'CONFERMATA', 'CHIUSA')),
  CONSTRAINT "bom_richiesta_unique" UNIQUE ("richiestaId"),
  CONSTRAINT "bom_richiesta_fk" FOREIGN KEY ("richiestaId") REFERENCES "richiesta_progetto"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "bom_tenant_stato_idx" ON "bom"("tenantId", "stato");
CREATE INDEX "bom_tenant_richiesta_idx" ON "bom"("tenantId", "richiestaId");

CREATE TABLE "bom_riga" (
  "id" TEXT NOT NULL,
  "bomId" TEXT NOT NULL,
  "ordinamento" INTEGER NOT NULL DEFAULT 0,
  "categoria" TEXT NOT NULL,
  "codice" TEXT,
  "descrizione" TEXT NOT NULL,
  "unita" TEXT NOT NULL DEFAULT 'pz',
  "quantita" DECIMAL(12,3) NOT NULL,
  "materiale" TEXT,
  "lavorazione" TEXT,
  "costoUnitario" DECIMAL(12,2),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "bom_riga_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bom_riga_bom_fk" FOREIGN KEY ("bomId") REFERENCES "bom"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "bom_riga_quantita_check" CHECK ("quantita" > 0),
  CONSTRAINT "bom_riga_costo_check" CHECK ("costoUnitario" IS NULL OR "costoUnitario" >= 0)
);

CREATE INDEX "bom_riga_bom_ordinamento_idx" ON "bom_riga"("bomId", "ordinamento");
