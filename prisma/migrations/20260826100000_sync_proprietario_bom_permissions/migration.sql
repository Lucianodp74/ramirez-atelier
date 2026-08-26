-- Allinea i permessi del ruolo di sistema Proprietario con il catalogo RBAC.
-- Il seed contiene la stessa sincronizzazione, ma il deploy Vercel esegue
-- solo `prisma migrate deploy`: questa migrazione rende la correzione
-- disponibile anche sui database preview/già esistenti senza richiedere un seed.

INSERT INTO "permesso" ("id", "ruoloId", "modulo", "azione")
SELECT
  md5(r."id" || ':' || p.modulo || ':' || p.azione),
  r."id",
  p.modulo,
  p.azione
FROM "ruolo" r
CROSS JOIN (
  VALUES
    ('richieste', 'leggi'),
    ('richieste', 'gestisci'),
    ('richieste', 'cambia_stato'),
    ('richieste', 'commenta'),
    ('fasce_budget', 'leggi'),
    ('fasce_budget', 'gestisci'),
    ('regole', 'leggi'),
    ('regole', 'gestisci'),
    ('utenti', 'leggi'),
    ('utenti', 'gestisci'),
    ('kpi', 'leggi'),
    ('catalogo', 'leggi'),
    ('catalogo', 'gestisci'),
    ('clienti', 'leggi'),
    ('clienti', 'gestisci'),
    ('spese', 'leggi'),
    ('spese', 'gestisci')
) AS p(modulo, azione)
WHERE r."nome" = 'Proprietario'
ON CONFLICT ("ruoloId", "modulo", "azione") DO NOTHING;
