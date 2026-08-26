-- Ripara i database gia esistenti in cui la Membership dell'amministratore
-- esisteva prima dell'assegnazione del ruolo Proprietario. Il seed precedente
-- assegnava il ruolo solo quando creava una nuova Membership.

INSERT INTO "membership_ruolo" ("membershipId", "ruoloId")
SELECT m."id", r."id"
FROM "membership" m
JOIN "utente" u ON u."id" = m."utenteId"
JOIN "ruolo" r ON r."tenantId" = m."tenantId" AND r."nome" = 'Proprietario'
WHERE m."tenantId" = 'tenant_ramirez_atelier'
  AND u."email" = 'titolare@ramirezatelier.it'
  AND m."stato" = 'ATTIVA'
ON CONFLICT ("membershipId", "ruoloId") DO NOTHING;
