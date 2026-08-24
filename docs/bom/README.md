# RAMIREZ OS — BOM / Distinta di produzione

## Foundation implemented

- migration PostgreSQL additiva per `bom` e `bom_riga`;
- una BOM per `RichiestaProgetto`;
- indici e query isolati per `tenantId`;
- stati `BOZZA`, `CONFERMATA`, `CHIUSA`;
- note di produzione;
- righe ordinate;
- quantità, unità, materiale e lavorazione;
- costo unitario opzionale, mai inventato dal servizio;
- servizio server-side che usa il client DB Prisma esistente e SQL parametrizzato.

## Vincoli di sicurezza

Il servizio rifiuta operazioni fuori dal `tenantId` corrente e impedisce modifiche quando la BOM non è più in `BOZZA`.
La migration è additiva e non modifica le tabelle applicative esistenti.

## Da completare prima del merge in produzione

1. applicare e validare la migration Prisma/PostgreSQL nell'ambiente del progetto;
2. aggiungere i modelli BOM a `schema.prisma` e rigenerare Prisma Client quando lo schema completo può essere aggiornato in sicurezza;
3. aggiungere endpoint protetti e interfaccia Admin usando gli helper identity/RBAC esistenti;
4. definire le regole prodotto/configuratore che trasformano una configurazione in righe BOM;
5. collegare il costing/Pricing Engine esclusivamente ai costi catalogo validati;
6. eseguire CI e test end-to-end.
