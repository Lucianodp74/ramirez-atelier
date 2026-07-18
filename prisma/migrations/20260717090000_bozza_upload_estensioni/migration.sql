-- Incremento 2: salvataggio automatico (BOZZA + token di ripresa), contatti
-- opzionali fino al completamento, categoria allegati, punto di estensione per
-- future integrazioni (AI/OCR/CAD/CV/Preventivatore/CRM - nessuna logica qui).
--
-- Verificata applicandola direttamente a PostgreSQL 16 reale, per lo stesso motivo
-- documentato nella migrazione 20260716230000_init (binaries.prisma.sh non
-- raggiungibile da questo ambiente di sviluppo).

ALTER TYPE "stato_richiesta" ADD VALUE IF NOT EXISTS 'BOZZA' BEFORE 'NUOVA';

CREATE TYPE "categoria_documento" AS ENUM ('FOTO', 'PDF', 'DWG_DXF', 'RENDER', 'VIDEO', 'ALTRO');
