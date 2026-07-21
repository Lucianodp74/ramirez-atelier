import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

/**
 * Prisma 7 ha spostato qui la configurazione di connessione (prima viveva in
 * schema.prisma). Il valore di `datasource.url` è quello che il CLI usa per le
 * migrazioni: usiamo DIRECT_URL (connessione diretta/sessione, porta 5432),
 * non DATABASE_URL (che è la stringa con pooler, pensata per l'app a runtime,
 * non per operazioni di schema come le migrazioni) - stesso principio di
 * `directUrl` in Prisma 6, solo spostato di posto.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: env('DIRECT_URL'),
  },
});
