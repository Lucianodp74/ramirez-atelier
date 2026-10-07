UPDATE "listino_prezzo" lp
SET "prezzo" = 40,
    "attivo" = true,
    "descrizione" = 'Ricarico commerciale del 40% per prezzo privato o architetto.'
FROM "tenant" t
WHERE lp."tenantId" = t."id"
  AND t."slug" = 'ramirez-atelier'
  AND lp."codice" = 'COMM-RICARICO';
