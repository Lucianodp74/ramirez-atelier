-- Catalogo Tecnico (ADR-0006) - Incremento 3: tabelle Ferramenta e Accessorio.
-- Stessa disciplina di Finitura (slug stabile, categoria come dato), senza
-- campione visivo: non rappresentano superfici.

CREATE TABLE "ferramenta" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "attiva" BOOLEAN NOT NULL DEFAULT true,
    "ordinamento" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ferramenta_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ferramenta_tenantId_slug_key" ON "ferramenta"("tenantId", "slug");
CREATE INDEX "ferramenta_tenantId_attiva_categoria_ordinamento_idx" ON "ferramenta"("tenantId", "attiva", "categoria", "ordinamento");

CREATE TABLE "accessorio" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "attiva" BOOLEAN NOT NULL DEFAULT true,
    "ordinamento" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "accessorio_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "accessorio_tenantId_slug_key" ON "accessorio"("tenantId", "slug");
CREATE INDEX "accessorio_tenantId_attiva_categoria_ordinamento_idx" ON "accessorio"("tenantId", "attiva", "categoria", "ordinamento");
