-- Catalogo Tecnico (ADR-0006 §3.7) - VariantePreimpostata: stili di
-- partenza per il wizard. Agganciata a TipoProgetto (Modello non ancora
-- costruito, nessun bisogno reale che lo giustifichi oggi).

CREATE TABLE "variante_preimpostata" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "tipoProgettoId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "scelte" JSONB NOT NULL,
    "attiva" BOOLEAN NOT NULL DEFAULT true,
    "ordinamento" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variante_preimpostata_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "variante_preimpostata_tenantId_tipoProgettoId_attiva_ordin_idx" ON "variante_preimpostata"("tenantId", "tipoProgettoId", "attiva", "ordinamento");

ALTER TABLE "variante_preimpostata" ADD CONSTRAINT "variante_preimpostata_tipoProgettoId_fkey" FOREIGN KEY ("tipoProgettoId") REFERENCES "tipo_progetto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Riferimento leggero, nessun vincolo di integrità referenziale (v. commento
-- nello schema): la variante scelta resta leggibile anche se la variante
-- stessa viene modificata o disattivata in seguito.
ALTER TABLE "richiesta_progetto" ADD COLUMN "variantePreimpostataId" TEXT;
