# BOM foundation status

Implemented on `feat/bom-foundation`:

- additive SQL migration for `bom` and `bom_riga`;
- tenant-scoped server service;
- create/read/add-row/state-change operations;
- quantity validation tests;
- explicit safety boundary: no invented costs and no cross-tenant access.

Not yet merged to `main` because the Prisma schema/client and production database migration still require validation in the project environment, followed by protected Admin UI/API and end-to-end tests.
