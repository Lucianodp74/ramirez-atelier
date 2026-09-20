-- COMPOSIZIONI / CATALOGO V1 - ProgettoPreimpostato.
-- Catalogo di progetti preimpostati che alimentano il Preventivatore
-- Modulare V2/V3 esistente: nessuna nuova logica di prezzo, nessuna nuova
-- BOM, nessuna modifica alle tabelle esistenti.
--
-- "moduli" contiene esclusivamente un ModuloConfigurato[] (stesso formato
-- già accettato da calcolaStimaPreventivatore/salvaRichiestaPreventivatore),
-- copiato per valore nel Preventivatore alla selezione - non referenziato
-- per id nel calcolo, stesso principio già usato da VariantePreimpostata e
-- dal freeze della richiesta.
--
-- Nome deliberatamente diverso da "Composizione": nel repo quel termine è
-- già usato da listino_prezzo (tipo='COMPOSIZIONE') per un concetto non
-- correlato (distinta interna di un articolo di Listino).

CREATE TABLE "progetto_preimpostato" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "descrizione" TEXT,
    "immagine" TEXT,
    "moduli" JSONB NOT NULL,
    "pubblicata" BOOLEAN NOT NULL DEFAULT false,
    "ordinamento" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "progetto_preimpostato_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "progetto_preimpostato_tenantId_pubblicata_ordinamento_idx" ON "progetto_preimpostato"("tenantId", "pubblicata", "ordinamento");
CREATE INDEX "progetto_preimpostato_tenantId_categoria_idx" ON "progetto_preimpostato"("tenantId", "categoria");
