ALTER TABLE "listino_prezzo"
  ADD COLUMN "tipo" TEXT NOT NULL DEFAULT 'COMPONENTE',
  ADD COLUMN "materiale" TEXT,
  ADD COLUMN "larghezzaCm" DECIMAL(10,2),
  ADD COLUMN "altezzaCm" DECIMAL(10,2),
  ADD COLUMN "profonditaCm" DECIMAL(10,2);

ALTER TABLE "listino_prezzo"
  ADD CONSTRAINT "listino_prezzo_tipo_check"
  CHECK ("tipo" IN ('MATERIALE', 'COMPONENTE', 'COMPOSIZIONE'));

CREATE INDEX "listino_prezzo_tenantId_tipo_attivo_idx"
  ON "listino_prezzo"("tenantId", "tipo", "attivo");
