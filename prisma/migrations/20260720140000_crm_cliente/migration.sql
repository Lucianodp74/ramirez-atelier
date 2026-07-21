-- CRM (Cliente) - nato dalla simulazione della giornata del titolare, non da
-- un elenco astratto di funzionalità. Deduplica deterministica su email o
-- telefono, mai sul nome.

CREATE TABLE "cliente" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "tipo" "cliente_tipo" NOT NULL DEFAULT 'PRIVATO',
    "azienda" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "cliente_tenantId_email_idx" ON "cliente"("tenantId", "email");
CREATE INDEX "cliente_tenantId_telefono_idx" ON "cliente"("tenantId", "telefono");

ALTER TABLE "richiesta_progetto" ADD COLUMN "clienteId" TEXT;
ALTER TABLE "richiesta_progetto" ADD CONSTRAINT "richiesta_progetto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migrazione dati: crea un Cliente per ogni email distinta già presente nelle
-- richieste esistenti (solo quelle non ancora in BOZZA, coerente con "un
-- cliente ha valore solo quando la richiesta è davvero inviata").
INSERT INTO "cliente" (id, "tenantId", nome, email, telefono, tipo, azienda, "createdAt", "updatedAt")
SELECT
    'cli_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20),
    r."tenantId",
    (array_agg(r."clienteNome" ORDER BY r."createdAt" DESC))[1],
    r."clienteEmail",
    (array_agg(r."clienteTelefono" ORDER BY r."createdAt" DESC))[1],
    COALESCE((array_agg(r."clienteTipo" ORDER BY r."createdAt" DESC))[1], 'PRIVATO'),
    (array_agg(r."clienteAzienda" ORDER BY r."createdAt" DESC))[1],
    now(),
    now()
FROM "richiesta_progetto" r
WHERE r."clienteEmail" IS NOT NULL AND r.stato != 'BOZZA'
GROUP BY r."tenantId", r."clienteEmail";

-- Poi un Cliente per le richieste senza email ma con telefono, distinto per
-- tenant+telefono (solo tra quelle non ancora collegate al passo precedente).
INSERT INTO "cliente" (id, "tenantId", nome, email, telefono, tipo, azienda, "createdAt", "updatedAt")
SELECT
    'cli_' || substr(md5(random()::text || clock_timestamp()::text), 1, 20),
    r."tenantId",
    (array_agg(r."clienteNome" ORDER BY r."createdAt" DESC))[1],
    NULL,
    r."clienteTelefono",
    COALESCE((array_agg(r."clienteTipo" ORDER BY r."createdAt" DESC))[1], 'PRIVATO'),
    (array_agg(r."clienteAzienda" ORDER BY r."createdAt" DESC))[1],
    now(),
    now()
FROM "richiesta_progetto" r
WHERE r."clienteEmail" IS NULL AND r."clienteTelefono" IS NOT NULL AND r.stato != 'BOZZA'
GROUP BY r."tenantId", r."clienteTelefono";

-- Collega ogni richiesta al Cliente corrispondente: prima per email, poi per
-- telefono tra quelle rimaste senza corrispondenza.
UPDATE "richiesta_progetto" r
SET "clienteId" = c.id
FROM "cliente" c
WHERE r."tenantId" = c."tenantId" AND r."clienteEmail" IS NOT NULL AND r."clienteEmail" = c.email;

UPDATE "richiesta_progetto" r
SET "clienteId" = c.id
FROM "cliente" c
WHERE r."clienteId" IS NULL
  AND r."tenantId" = c."tenantId"
  AND r."clienteTelefono" IS NOT NULL
  AND r."clienteTelefono" = c.telefono
  AND c.email IS NULL;
