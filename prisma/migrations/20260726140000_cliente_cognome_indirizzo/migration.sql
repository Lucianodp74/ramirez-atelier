-- Gestione Cliente: separa nome/cognome, aggiunge indirizzo.

ALTER TABLE "cliente" ADD COLUMN "cognome" TEXT;
ALTER TABLE "cliente" ADD COLUMN "indirizzo" TEXT;

-- Migrazione dati per i clienti già esistenti: divide euristicamente il
-- "nome" attuale (nome completo, es. "Luciano del Priore") sulla prima
-- parola come nome, il resto come cognome. Un'euristica, non un parser di
-- nomi vero (non gestisce correttamente casi come "Maria Grazia Rossi") -
-- correggibile a mano dal pannello Clienti dopo questa migrazione, come
-- concordato esplicitamente prima di questa modifica.
UPDATE "cliente"
SET
  "cognome" = CASE
    WHEN position(' ' in "nome") > 0
    THEN trim(substring("nome" from position(' ' in "nome") + 1))
    ELSE NULL
  END,
  "nome" = CASE
    WHEN position(' ' in "nome") > 0
    THEN trim(substring("nome" from 1 for position(' ' in "nome") - 1))
    ELSE "nome"
  END
WHERE "nome" IS NOT NULL;
