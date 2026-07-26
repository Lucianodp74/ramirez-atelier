-- DropForeignKey
ALTER TABLE "fascia_budget" DROP CONSTRAINT "fascia_budget_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "regola" DROP CONSTRAINT "regola_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "richiesta_progetto" DROP CONSTRAINT "richiesta_progetto_tenantId_fkey";

-- DropForeignKey
ALTER TABLE "tipo_progetto" DROP CONSTRAINT "tipo_progetto_tenantId_fkey";

-- RenameIndex
ALTER INDEX "variante_preimpostata_tenantId_tipoProgettoId_attiva_ordin_idx" RENAME TO "variante_preimpostata_tenantId_tipoProgettoId_attiva_ordina_idx";
