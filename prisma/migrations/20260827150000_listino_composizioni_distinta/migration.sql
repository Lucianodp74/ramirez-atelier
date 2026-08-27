-- Distinta interna delle composizioni del Listino Atelier.
-- Il costo unitario viene salvato come snapshot: modificare il listino di un
-- componente non riscrive retroattivamente il costo della composizione.
CREATE TABLE "listino_composizione_riga" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "composizioneId" TEXT NOT NULL,
  "componenteId" TEXT NOT NULL,
  "quantita" DECIMAL(12,3) NOT NULL DEFAULT 1,
  "costoUnitario" DECIMAL(12,2) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "listino_composizione_riga_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "listino_composizione_riga_tenant_fk" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "listino_composizione_riga_composizione_fk" FOREIGN KEY ("composizioneId") REFERENCES "listino_prezzo"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "listino_composizione_riga_componente_fk" FOREIGN KEY ("componenteId") REFERENCES "listino_prezzo"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "listino_composizione_riga_quantita_chk" CHECK ("quantita" > 0),
  CONSTRAINT "listino_composizione_riga_costo_chk" CHECK ("costoUnitario" >= 0)
);

CREATE UNIQUE INDEX "listino_composizione_riga_unique" ON "listino_composizione_riga"("tenantId", "composizioneId", "componenteId");
CREATE INDEX "listino_composizione_riga_composizione_idx" ON "listino_composizione_riga"("tenantId", "composizioneId");
CREATE INDEX "listino_composizione_riga_componente_idx" ON "listino_composizione_riga"("tenantId", "componenteId");
