UPDATE "listino_prezzo" lp
SET "prezzo" = 700, "attivo" = true,
    "descrizione" = 'Costo fisso complessivo del sistema ante scorrevoli per armadio.'
FROM "tenant" t
WHERE lp."tenantId" = t."id"
  AND t."slug" = 'ramirez-atelier'
  AND lp."codice" = 'FER-SCORREVOLE';
