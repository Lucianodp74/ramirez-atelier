-- Preventivo PDF v1: dati anagrafici minimi del tenant (mittente del
-- documento) e numerazione del preventivo, assegnata una sola volta.

ALTER TABLE "tenant" ADD COLUMN "indirizzo" TEXT;
ALTER TABLE "tenant" ADD COLUMN "partitaIva" TEXT;
ALTER TABLE "tenant" ADD COLUMN "telefono" TEXT;
ALTER TABLE "tenant" ADD COLUMN "emailPubblica" TEXT;

ALTER TABLE "richiesta_progetto" ADD COLUMN "numeroPreventivo" TEXT;
ALTER TABLE "richiesta_progetto" ADD COLUMN "preventivoGeneratoIl" TIMESTAMP(3);
