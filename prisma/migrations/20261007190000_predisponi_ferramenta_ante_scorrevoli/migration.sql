-- Predispone una voce separata per la ferramenta delle ante scorrevoli.
-- La voce resta inattiva finché Ramirez non definisce il costo reale nel Listino.
INSERT INTO "listino_prezzo" (
  "id", "tenantId", "tipo", "categoria", "codice", "nome", "descrizione",
  "unita", "prezzo", "attivo"
)
SELECT
  'b1000000-0000-4000-8000-000000000018', t.id, 'COMPONENTE', 'PREVENTIVATORE',
  'FER-SCORREVOLE', 'Ferramenta anta scorrevole',
  'Costo tecnico per anta scorrevole; configurare il valore reale prima dell''uso.',
  'PZ', 0, false
FROM (SELECT "id" FROM "tenant" WHERE "slug" = 'ramirez-atelier' LIMIT 1) AS t
ON CONFLICT ("tenantId", "codice") DO NOTHING;
