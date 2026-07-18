-- Incremento 7: rimozione di RegolaPrezzo (Incremento 1), mai realmente
-- interrogata da alcun codice, sostituita dal Rule Engine generico
-- (Regola/EsecuzioneRegola, contesto="preventivo_pricing") - il "secondo
-- consumatore reale" che ADR-0003 poneva come condizione per questa migrazione.
--
-- Verificata applicandola direttamente a PostgreSQL 16 reale (stesso motivo
-- delle migrazioni precedenti: binaries.prisma.sh non raggiungibile qui).

DROP TABLE IF EXISTS "regola_prezzo";
