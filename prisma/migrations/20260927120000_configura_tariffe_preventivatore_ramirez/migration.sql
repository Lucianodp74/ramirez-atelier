-- Configurazione iniziale delle 17 tariffe tecniche del Preventivatore Modulare V2.
-- I valori sono quelli approvati per il primo banco prova Ramirez.
-- Non sovrascrive eventuali valori già personalizzati: aggiorna solo voci nuove
-- oppure ancora predisposte con prezzo 0/inattive.

INSERT INTO "listino_prezzo" (
  "id", "tenantId", "tipo", "categoria", "codice", "nome", "descrizione",
  "unita", "prezzo", "attivo"
)
SELECT
  v.id, t.id, v.tipo, 'PREVENTIVATORE', v.codice, v.nome, v.descrizione,
  v.unita, v.prezzo, true
FROM (VALUES
  ('b1000000-0000-4000-8000-000000000001', 'MATERIALE', 'MAT-TRUCIOLARE', 'Truciolare', 'Costo tecnico truciolare per superficie.', 'M2', 18.00),
  ('b1000000-0000-4000-8000-000000000002', 'MATERIALE', 'MAT-MDF', 'MDF', 'Costo tecnico MDF per superficie.', 'M2', 28.00),
  ('b1000000-0000-4000-8000-000000000003', 'MATERIALE', 'MAT-MULTISTRATO', 'Multistrato', 'Costo tecnico multistrato per superficie.', 'M2', 45.00),
  ('b1000000-0000-4000-8000-000000000004', 'COMPONENTE', 'FIN-MELAMINICO', 'Melaminico', 'Costo tecnico finitura melaminica per superficie.', 'M2', 4.00),
  ('b1000000-0000-4000-8000-000000000005', 'COMPONENTE', 'FIN-LAMINATO', 'Laminato', 'Costo tecnico finitura laminata per superficie.', 'M2', 25.00),
  ('b1000000-0000-4000-8000-000000000006', 'COMPONENTE', 'FIN-LACCATO', 'Laccato', 'Costo tecnico finitura laccata per superficie.', 'M2', 45.00),
  ('b1000000-0000-4000-8000-000000000007', 'COMPONENTE', 'SERV-BORDO-ML', 'Bordatura', 'Costo tecnico della bordatura per metro lineare.', 'ML', 2.50),
  ('b1000000-0000-4000-8000-000000000008', 'MATERIALE', 'MAT-RETRO-M2', 'Retro', 'Costo tecnico del materiale per schienali.', 'M2', 12.00),
  ('b1000000-0000-4000-8000-000000000009', 'COMPONENTE', 'FER-PORTA', 'Ferramenta porta', 'Costo tecnico ferramenta per porta.', 'PZ', 19.50),
  ('b1000000-0000-4000-8000-000000000010', 'COMPONENTE', 'FER-CASSETTO', 'Ferramenta cassetto', 'Costo tecnico ferramenta per cassetto.', 'PZ', 28.00),
  ('b1000000-0000-4000-8000-000000000011', 'COMPONENTE', 'MAN-ORE-BASE', 'Ore base', 'Ore di lavorazione base per modulo.', 'H', 0.80),
  ('b1000000-0000-4000-8000-000000000012', 'COMPONENTE', 'MAN-ORE-M2', 'Ore per m²', 'Ore di lavorazione proporzionali alla superficie.', 'H/M2', 0.90),
  ('b1000000-0000-4000-8000-000000000013', 'COMPONENTE', 'MAN-ORE-PORTA', 'Ore per porta', 'Ore di lavorazione aggiuntive per porta.', 'H/PZ', 0.35),
  ('b1000000-0000-4000-8000-000000000014', 'COMPONENTE', 'MAN-ORE-CASSETTO', 'Ore per cassetto', 'Ore di lavorazione aggiuntive per cassetto.', 'H/PZ', 0.50),
  ('b1000000-0000-4000-8000-000000000015', 'COMPONENTE', 'MAN-ORE-RIPIANO', 'Ore per ripiano', 'Ore di lavorazione aggiuntive per ripiano.', 'H/PZ', 0.12),
  ('b1000000-0000-4000-8000-000000000016', 'COMPONENTE', 'MAN-COSTO-ORA', 'Costo orario', 'Costo tecnico della manodopera per ora.', 'EUR/H', 40.00),
  ('b1000000-0000-4000-8000-000000000017', 'COMPONENTE', 'COMM-RICARICO', 'Ricarico commerciale', 'Ricarico commerciale configurato per il primo banco prova.', '%', 35.00)
) AS v(id, tipo, codice, nome, descrizione, unita, prezzo)
CROSS JOIN (SELECT "id" FROM "tenant" WHERE "slug" = 'ramirez-atelier' LIMIT 1) AS t
ON CONFLICT ("tenantId", "codice") DO UPDATE
SET
  "tipo" = EXCLUDED."tipo",
  "categoria" = EXCLUDED."categoria",
  "nome" = EXCLUDED."nome",
  "descrizione" = EXCLUDED."descrizione",
  "unita" = EXCLUDED."unita",
  "prezzo" = EXCLUDED."prezzo",
  "attivo" = true,
  "updatedAt" = CURRENT_TIMESTAMP
WHERE "listino_prezzo"."prezzo" = 0
   OR "listino_prezzo"."attivo" = false;
