ALTER TABLE "commessa_riga_produzione"
  ADD COLUMN "statoLavorazione" TEXT NOT NULL DEFAULT 'DA_FARE';

ALTER TABLE "commessa_riga_produzione"
  ADD CONSTRAINT "commessa_riga_produzione_statoLavorazione_check"
  CHECK ("statoLavorazione" IN ('DA_FARE', 'IN_LAVORAZIONE', 'COMPLETATA'));

CREATE INDEX "commessa_riga_produzione_statoLavorazione_idx"
  ON "commessa_riga_produzione"("tenantId", "commessaId", "statoLavorazione");
