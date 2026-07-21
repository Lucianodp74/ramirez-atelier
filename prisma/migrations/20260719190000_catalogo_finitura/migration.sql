-- Catalogo Tecnico (ADR-0006) - Incremento 1: tabella Finitura.
-- Nessuna colonna di costo/fornitore (Premature Modeling - non ancora
-- validata da un consumatore reale, v. docs/principi in ArtigianOS).

CREATE TABLE "finitura" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "coloreHex" TEXT NOT NULL,
    "texture" TEXT NOT NULL,
    "attiva" BOOLEAN NOT NULL DEFAULT true,
    "ordinamento" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "finitura_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "finitura_tenantId_slug_key" ON "finitura"("tenantId", "slug");
CREATE INDEX "finitura_tenantId_attiva_categoria_ordinamento_idx" ON "finitura"("tenantId", "attiva", "categoria", "ordinamento");
