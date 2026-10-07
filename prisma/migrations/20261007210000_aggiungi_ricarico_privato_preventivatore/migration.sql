INSERT INTO "listino_prezzo" (
  "id", "tenantId", "tipo", "categoria", "codice", "nome", "descrizione",
  "unita", "prezzo", "attivo"
)
SELECT
  'b1000000-0000-4000-8000-000000000019', t.id, 'COMPONENTE', 'PREVENTIVATORE',
  'COMM-RICARICO-PRIVATO', 'Ricarico privato / architetto',
  'Ricarico applicato al prezzo falegname per ottenere il prezzo privato o architetto.',
  '%', 40, true
FROM (SELECT "id" FROM "tenant" WHERE "slug" = 'ramirez-atelier' LIMIT 1) AS t
ON CONFLICT ("tenantId", "codice") DO UPDATE
SET "prezzo" = EXCLUDED."prezzo",
    "attivo" = EXCLUDED."attivo",
    "nome" = EXCLUDED."nome",
    "descrizione" = EXCLUDED."descrizione";
