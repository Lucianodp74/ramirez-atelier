-- BOM price history: immutable audit trail for effective unit-price changes.
CREATE TABLE "bom_riga_prezzo_storico" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "bomId" TEXT NOT NULL,
  "bomRigaId" TEXT NOT NULL,
  "costoPrecedente" DECIMAL(12,2),
  "costoNuovo" DECIMAL(12,2),
  "tipo" TEXT NOT NULL,
  "utenteId" TEXT,
  "membershipId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bom_riga_prezzo_storico_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "bom_riga_prezzo_storico_bom_fk" FOREIGN KEY ("bomId") REFERENCES "bom"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "bom_riga_prezzo_storico_riga_fk" FOREIGN KEY ("bomRigaId") REFERENCES "bom_riga"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "bom_riga_prezzo_storico_tipo_check" CHECK ("tipo" IN ('INSERIMENTO', 'MODIFICA')),
  CONSTRAINT "bom_riga_prezzo_storico_costo_check" CHECK (("costoPrecedente" IS NULL OR "costoPrecedente" >= 0) AND ("costoNuovo" IS NULL OR "costoNuovo" >= 0))
);

CREATE INDEX "bom_riga_prezzo_storico_riga_data_idx" ON "bom_riga_prezzo_storico"("bomRigaId", "createdAt");
CREATE INDEX "bom_riga_prezzo_storico_tenant_data_idx" ON "bom_riga_prezzo_storico"("tenantId", "createdAt");
