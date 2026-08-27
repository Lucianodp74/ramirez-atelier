-- Catalogo iniziale del Listino Atelier.
-- Sono valori di riferimento modificabili dal titolare, non prezzi dichiarati come
-- costi reali di fornitore. La migrazione usa ON CONFLICT DO NOTHING per non
-- sovrascrivere eventuali voci già personalizzate.

INSERT INTO "listino_prezzo" (
  "id", "tenantId", "tipo", "categoria", "codice", "nome", "descrizione",
  "unita", "prezzo", "attivo", "materiale", "larghezzaCm", "altezzaCm", "profonditaCm"
)
SELECT
  v.id, t.id, v.tipo, v.categoria, v.codice, v.nome, v.descrizione,
  v.unita, v.prezzo, true, v.materiale, v.larghezzaCm, v.altezzaCm, v.profonditaCm
FROM (VALUES
  ('a1000000-0000-4000-8000-000000000001', 'MATERIALE', 'pannelli', 'MUL-BET-18', 'Multistrato betulla 18 mm', 'Pannello strutturale in multistrato di betulla, riferimento iniziale modificabile.', 'm²', 45.00, 'Betulla', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000002', 'MATERIALE', 'pannelli', 'MUL-BET-15', 'Multistrato betulla 15 mm', 'Pannello in multistrato di betulla 15 mm, riferimento iniziale modificabile.', 'm²', 40.00, 'Betulla', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000003', 'MATERIALE', 'pannelli', 'MDF-18', 'MDF 18 mm', 'MDF grezzo 18 mm per parti interne e lavorazioni, riferimento iniziale modificabile.', 'm²', 28.00, 'MDF', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000004', 'MATERIALE', 'pannelli', 'TRU-18', 'Truciolare 18 mm', 'Pannello truciolare 18 mm, riferimento iniziale modificabile.', 'm²', 18.00, 'Truciolare', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000005', 'MATERIALE', 'pannelli', 'NOB-18', 'Nobilitato 18 mm', 'Pannello nobilitato 18 mm, riferimento iniziale modificabile.', 'm²', 22.00, 'Nobilitato', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000006', 'MATERIALE', 'pannelli', 'IMP-ROV-18', 'Impiallacciato rovere 18 mm', 'Pannello impiallacciato rovere 18 mm, riferimento iniziale modificabile.', 'm²', 65.00, 'Rovere', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000007', 'MATERIALE', 'massello', 'MAS-ROV', 'Massello rovere', 'Legno massello di rovere, riferimento iniziale modificabile.', 'm²', 85.00, 'Rovere', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000008', 'COMPONENTE', 'bordatura', 'BORD-PVC', 'Bordatura PVC', 'Bordatura standard per pannelli.', 'ml', 2.50, 'PVC', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000009', 'COMPONENTE', 'schiene', 'SCH-MDF-6', 'Schiena MDF 6 mm', 'Schiena per mobili e composizioni.', 'm²', 12.00, 'MDF', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000010', 'COMPONENTE', 'ferramenta', 'CER-SC', 'Cerniera soft-close', 'Cerniera ammortizzata di riferimento.', 'pz', 6.50, 'Ferramenta', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000011', 'COMPONENTE', 'ferramenta', 'GUI-CAS', 'Guida cassetto soft-close', 'Coppia di guide per cassetto, riferimento iniziale modificabile.', 'pz', 28.00, 'Ferramenta', NULL::numeric, NULL::numeric, NULL::numeric),
  ('a1000000-0000-4000-8000-000000000012', 'COMPOSIZIONE', 'colonne', 'COL-MUL-90-260-60', 'Colonna 90 × H260 × P60 in multistrato', 'Composizione tipo: colonna 90 cm, altezza 260 cm, profondità 60 cm, multistrato. Prezzo iniziale di riferimento modificabile.', 'pz', 1200.00, 'Multistrato', 90, 260, 60),
  ('a1000000-0000-4000-8000-000000000013', 'COMPOSIZIONE', 'colonne', 'COL-MUL-60-260-60', 'Colonna 60 × H260 × P60 in multistrato', 'Composizione tipo: colonna 60 cm, altezza 260 cm, profondità 60 cm, multistrato. Prezzo iniziale di riferimento modificabile.', 'pz', 900.00, 'Multistrato', 60, 260, 60),
  ('a1000000-0000-4000-8000-000000000014', 'COMPOSIZIONE', 'basi', 'BASE-MUL-60-72-60', 'Base 60 × H72 × P60 in multistrato', 'Composizione tipo: base 60 cm, altezza 72 cm, profondità 60 cm, multistrato.', 'pz', 480.00, 'Multistrato', 60, 72, 60),
  ('a1000000-0000-4000-8000-000000000015', 'COMPOSIZIONE', 'pensili', 'PENS-MUL-60-72-35', 'Pensile 60 × H72 × P35 in multistrato', 'Composizione tipo: pensile 60 cm, altezza 72 cm, profondità 35 cm, multistrato.', 'pz', 390.00, 'Multistrato', 60, 72, 35),
  ('a1000000-0000-4000-8000-000000000016', 'COMPOSIZIONE', 'contenitori', 'MOD-CASSETTI-60', 'Modulo 60 con 4 cassetti', 'Composizione tipo: modulo 60 cm con quattro cassetti e ferramenta standard.', 'pz', 620.00, 'Multistrato', 60, NULL::numeric, 60),
  ('a1000000-0000-4000-8000-000000000017', 'COMPOSIZIONE', 'librerie', 'LIB-MUL-90-240-35', 'Libreria 90 × H240 × P35 in multistrato', 'Composizione tipo: libreria 90 cm, altezza 240 cm, profondità 35 cm.', 'pz', 980.00, 'Multistrato', 90, 240, 35),
  ('a1000000-0000-4000-8000-000000000018', 'COMPOSIZIONE', 'armadi', 'ARM-MUL-120-260-60', 'Armadio 120 × H260 × P60 in multistrato', 'Composizione tipo: armadio 120 cm, altezza 260 cm, profondità 60 cm, struttura in multistrato.', 'pz', 1650.00, 'Multistrato', 120, 260, 60)
) AS v(id, tipo, categoria, codice, nome, descrizione, unita, prezzo, materiale, larghezzaCm, altezzaCm, profonditaCm)
CROSS JOIN (SELECT "id" FROM "tenant" WHERE "slug" = 'ramirez-atelier' LIMIT 1) AS t
ON CONFLICT ("tenantId", "codice") DO NOTHING;
