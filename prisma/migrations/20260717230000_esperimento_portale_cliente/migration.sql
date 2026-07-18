-- Incremento 9: esperimento "Portale Cliente" minimo (v. Architecture Roadmap
-- e nota di confronto Notifiche/Portale/CRM nel repository ArtigianOS).
--
-- Nessuna nuova tabella: si riusa il tokenRipresa già esistente su
-- richiesta_progetto (Incremento 2) come link permanente di sola consultazione,
-- e la tabella evento_attivita già esistente per tracciare l'uso reale -
-- un solo nuovo valore enum, additivo, nessun rischio sui dati esistenti.
--
-- Verificata applicandola direttamente a PostgreSQL 16 reale (stesso motivo
-- delle migrazioni precedenti: binaries.prisma.sh non raggiungibile qui).

ALTER TYPE "tipo_evento_attivita" ADD VALUE 'STATO_CONSULTATO_DAL_CLIENTE';
