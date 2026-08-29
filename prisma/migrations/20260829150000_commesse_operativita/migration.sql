-- Prima fondazione del ciclo produttivo: una richiesta CONVERTITA
-- diventa una commessa operativa senza modificare la BOM originale.
-- Le righe produzione sono snapshot: da qui in avanti il lavoro ha una
-- propria verità operativa e non dipende da modifiche future al listino/BOM.

CREATE TABLE "commessa" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "richiestaId" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "stato" TEXT NOT NULL DEFAULT 'DA_AVVIARE',
  "noteProduzione" TEXT,
  "fonteBomId" TEXT,
  "fonteBomVersione" INTEGER,
  "dataPrevistaConsegna" TIMESTAMP(3),
  "avviataIl" TIMESTAMP(3),
  "prontaIl" TIMESTAMP(3),
  "consegnataIl" TIMESTAMP(3),
  "chiusaIl" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commessa_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "commessa_tenant_fk" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "commessa_richiesta_fk" FOREIGN KEY ("richiestaId") REFERENCES "richiesta_progetto"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "commessa_stato_chk" CHECK ("stato" IN ('DA_AVVIARE','IN_PRODUZIONE','PRONTA','CONSEGNATA','CHIUSA','ANNULLATA'))
);
CREATE UNIQUE INDEX "commessa_tenant_richiesta_unique" ON "commessa"("tenantId", "richiestaId");
CREATE UNIQUE INDEX "commessa_tenant_numero_unique" ON "commessa"("tenantId", "numero");
CREATE INDEX "commessa_tenant_stato_idx" ON "commessa"("tenantId", "stato", "updatedAt");
CREATE INDEX "commessa_tenant_consegna_idx" ON "commessa"("tenantId", "dataPrevistaConsegna");

CREATE TABLE "commessa_riga_produzione" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "commessaId" TEXT NOT NULL,
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
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "commessa_riga_produzione_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "commessa_riga_tenant_fk" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "commessa_riga_commessa_fk" FOREIGN KEY ("commessaId") REFERENCES "commessa"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "commessa_riga_quantita_chk" CHECK ("quantita" > 0),
  CONSTRAINT "commessa_riga_costo_chk" CHECK ("costoUnitario" IS NULL OR "costoUnitario" >= 0)
);
CREATE INDEX "commessa_riga_tenant_commessa_idx" ON "commessa_riga_produzione"("tenantId", "commessaId", "ordinamento");
