# Piano di Pubblicazione — Ramirez Atelier v1

**Riferimento architetturale:** ADR-0005 (Strategia di Infrastruttura e Deployment, repository ArtigianOS) — questo documento è il "come" eseguire ciò che lì è stato deciso, non una nuova decisione. Se una fase qui sotto sembra in conflitto con ADR-0005, vince ADR-0005: questo runbook va corretto, non l'architettura.

**Come leggere questo piano:** ogni fase ha obiettivo, prerequisiti, attività, verifiche, rollback. Le fasi sono sequenziali — non saltare una fase per "recuperarla dopo", in particolare le Fasi 3 e 5 (pooling e password del seed), che sono più semplici da fare bene la prima volta che da correggere con utenti reali già presenti.

**Prima di iniziare, una distinzione che conta:** durante tutto lo sviluppo, la verifica di ogni incremento è stata fatta con un adattatore locale che imita `@prisma/client` (necessario perché questo ambiente di sviluppo non raggiunge `binaries.prisma.sh`). Da qui in avanti si userà il **client Prisma reale** — `npx prisma generate` funzionerà per davvero, senza adattatori. È una discontinuità importante: le migrazioni sono state scritte a mano come SQL puro e verificate contro Postgres reale proprio per essere applicabili senza sorprese in questo momento, ma è comunque il primo punto in cui il codice incontra la toolchain Prisma completa.

---

## Fase 0 — Verifica dei prerequisiti

**Obiettivo:** confermare che tutto quanto presuppone questo piano sia davvero pronto, prima di spendere tempo su una fase che si bloccherebbe a metà.

**Prerequisiti:** nessuno (è il punto di partenza).

**Attività:**

- Account GitHub, Vercel, Supabase attivi.
- **Node.js 22** richiesto (dichiarato in `package.json` → `engines`) — su Vercel, verificare in Project Settings → General → Node.js Version che sia impostato su 22.x, non dedotto automaticamente da una versione precedente.
- Verifica esplicita di cosa include il piano Supabase scelto (retention dei backup, point-in-time recovery) — non presumere (ADR-0005 §5, punto 4).
- **Storage documenti: Supabase Storage** (decisione già presa, mai registrata fino a questa revisione) — non Cloudflare R2 né MinIO: stesso account Supabase già in uso per il database (Fase 2), S3-compatibile, endpoint `https://<project-ref>.storage.supabase.co/storage/v1/s3`. Passi concreti: Dashboard Supabase → Storage → creare un bucket privato chiamato **`uploads`** (nome infrastrutturale, non legato al dominio — v. ADR-0009 per la motivazione completa e la convenzione delle chiavi al suo interno) → Storage → S3 Configuration → generare Access Key/Secret Key dedicate. L'adattatore in `src/lib/storage/` non richiede alcuna modifica: si attiva automaticamente quando `S3_ENDPOINT` è impostato, indipendentemente dal provider specifico.
- Decisione del provider email transazionale per l'invio reale (es. Resend, Postmark) — **aggiornamento rispetto alla stesura originale di questo runbook**: `recupero-password-service.ts` non genera più soltanto il token, l'intero ciclo (recupero password, inviti, notifiche a staff e cliente) è implementato e verificato end-to-end tramite `InvioEmailAdapter` (v. `src/lib/notifiche/`) — oggi con un adattatore console che scrive nel log del server, non un invio reale. Resta da fare solo un secondo, piccolo intervento: implementare l'adattatore per il provider scelto (stessa interfaccia, un secondo file) e impostare le sue credenziali in produzione (Fase 6). Senza questo passo, le email in produzione continuerebbero a "inviarsi" solo nei log del server, mai recapitate per davvero.

**Verifiche:** possiedi le credenziali di tutti e tre i servizi; hai una risposta a "cosa succede se perdo il database" prima di crearne uno reale — non solo aver letto cosa include il piano, ma aver **provato concretamente un ripristino** (Supabase permette di clonare un progetto o ripristinare a un punto nel tempo su piani a pagamento): un backup mai testato equivale, nella pratica, a non avere un backup.

**Rollback:** nessuno — non è stato ancora toccato nulla.

---

## Fase 1 — Repository locale → GitHub

**Obiettivo:** portare il codice su un repository GitHub reale, pronto per essere collegato a Vercel.

**Prerequisiti:** repository Git locale con la storia degli Incrementi 1-9, `git status` pulito.

**Attività:**

- Creare un repository **privato** su GitHub (non pubblico — v. nota critica sotto).
- `git remote add origin <url>` e push di tutti i branch/tag rilevanti.

**Nota critica da non saltare:** `prisma/seed.ts` contiene, nel codice sorgente, la password letterale dell'utente amministratore di sviluppo (`CambiamiSubito123`). Anche con repository privato, questo va trattato come un problema da risolvere (Fase 5), non ignorato confidando nella privacy del repository — l'oscurità non è un controllo di sicurezza, e chiunque ottenga accesso al repository in futuro (un collaboratore, un fork, un errore di configurazione della visibilità) otterrebbe anche quella password.

**Verifiche:** il repository è privato (verificare esplicitamente nelle impostazioni, non assumerlo); push riuscito; il file `.env` (mai `.env.example`) non è tracciato — verificare con `git ls-files | grep "^\.env$"` che non dia risultati.

**Rollback:** nessun rischio — nessun dato reale coinvolto. In caso di problemi, eliminare il repository GitHub e ricrearlo.

---

## Fase 2 — Provisioning del progetto Supabase

**Obiettivo:** creare l'istanza PostgreSQL di produzione.

**Prerequisiti:** Fase 0 completata (piano Supabase scelto con backup verificati).

**Attività:**

- Creare un nuovo progetto Supabase, regione vicina agli utenti reali (Europa).
- Impostare una password del database generata casualmente (non riutilizzare quella di sviluppo), salvata in un password manager — mai nel repository.
- Recuperare le stringhe dal pannello **Connect → ORM → Prisma** del progetto (non "Project Settings → Database", spostato lì nelle versioni recenti dell'interfaccia). **Nota su un'assunzione rivista durante la Fase 3**: la connessione "diretta" storica di Supabase (`db.<project-ref>.supabase.co`) oggi è raggiungibile solo su IPv6 di default — non adatta a un ambiente come Vercel, che non garantisce IPv6 in uscita. Per questo Supabase offre, ed è quello che useremo, un **Session Pooler** compatibile IPv4: stesso host del pooler transazionale (`aws-0-<regione>.pooler.supabase.com`), ma sulla porta **5432** invece di **6543** — si comporta come una connessione diretta (supporta i prepared statement, le migrazioni) pur passando dall'infrastruttura del pooler. `DATABASE_URL` = pooler transazionale, porta 6543, `?pgbouncer=true`; `DIRECT_URL` = session pooler, stesso host, porta 5432, nessun parametro aggiuntivo.

**Verifiche:** connessione riuscita a entrambe le stringhe con `psql` o un client equivalente.

**Nota operativa (piano FREE, decisione confermata durante la Fase 3 — restare su FREE per ora, non passare a Pro):** un progetto sul piano FREE **va in pausa automaticamente dopo una settimana senza richieste API**. Non è perdita dati (il progetto resta recuperabile), ma diventa irraggiungibile finché non lo si riattiva manualmente dalla Dashboard — un rischio concreto durante un pilota con una sola falegnameria, se il traffico reale è discontinuo. **Mitigazione minima finché si resta su FREE**: verificare manualmente che il progetto sia attivo prima di ogni demo pianificata; se il periodo tra un test e l'altro rischia di superare una settimana, effettuare una richiesta qualunque (anche solo aprire la Dashboard) per resettare il conteggio. Da rivalutare (passaggio a Pro) se il pilota richiede disponibilità continua non presidiata.

**Rollback:** eliminare il progetto Supabase e ricrearlo — nessun dato ancora presente, operazione senza rischio in questa fase.

---

## Fase 3 — Connection pooling nello schema Prisma

**Obiettivo:** separare la connessione usata a runtime dall'app (che deve passare dal pooler) da quella usata per le migrazioni (diretta) — ADR-0005 §3, checklist punto 3. Senza questo, il primo giorno di traffico reale rischia di esaurire le connessioni disponibili al database.

**Prerequisiti:** Fase 2 completata, entrambe le stringhe di connessione disponibili.

**Attività:**

- Modificare il blocco `datasource` in `prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider  = "postgresql"
    url       = env("DATABASE_URL")   // stringa con pooler, porta 6543, ?pgbouncer=true
    directUrl = env("DIRECT_URL")     // stringa diretta, porta 5432, solo per le migrazioni
  }
  ```
- `.env.example` aggiornato di conseguenza. **Fatto** (Pre-Flight Review pre-Supabase): rimosso il commento residuo su "NextAuth/Auth.js" — riferimento a una direzione mai adottata, superato da quando Identity & Security è stato costruito da zero con sessioni opache custom (ADR-0004).

**Verifiche:** `npx prisma validate` non segnala errori.

**Rollback:** revert del commit — nessun impatto sui dati, è una modifica di sola configurazione.

---

## Fase 4 — Applicazione delle migrazioni reali

**Obiettivo:** portare lo schema su Supabase con il client Prisma reale.

**Prerequisiti:** Fase 3 completata; `DIRECT_URL` e `DATABASE_URL` impostate nell'ambiente locale per questa operazione una tantum.

**Attività:**

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

**Verifiche:**

- `npx prisma migrate status` conferma tutte e 8 le migrazioni applicate (dalla `20260716230000_init` alla `20260717230000_esperimento_portale_cliente`).
- Ispezione diretta (`\dt` in `psql`) conferma la presenza delle ~19 tabelle attese.
- Un controllo mirato: `SELECT enum_range(NULL::tipo_evento_attivita);` deve includere `STATO_CONSULTATO_DAL_CLIENTE` (l'ultima migrazione, additiva) — se manca, la sequenza si è fermata prima.

**Rollback:** essendo il primissimo deploy, **nessun dato reale è a rischio**. In caso di errore: `DROP SCHEMA public CASCADE; CREATE SCHEMA public;` e ripetere la Fase 4 da capo. Questo rollback drastico è accettabile **solo in questa fase, prima del lancio pubblico** — va escluso categoricamente una volta che ci sono utenti reali (a quel punto serve un vero restore da backup, mai un reset dello schema).

---

## Fase 5 — Seed di produzione

**Obiettivo:** creare il Tenant Ramirez Atelier, le fasce di budget, i tipi di progetto, il ruolo Proprietario e l'utente amministratore reale — senza portare in produzione la password di sviluppo nota (v. Fase 1).

**Prerequisiti:** Fase 4 completata; provider email configurato (Fase 0) se si vuole usare il flusso di recupero password invece di un intervento manuale.

**Attività (una delle due, non entrambe):**

- **Opzione A (consigliata):** modificare temporaneamente `prisma/seed.ts` perché generi una password casuale per l'utente amministratore e la stampi una sola volta a console (mai committata), da comunicare al titolare fuori banda (non via email, non via chat non cifrata).
- **Opzione B:** eseguire il seed come oggi (con la password nota) ed effettuare **subito** un primo login seguito da cambio password, prima di comunicare qualunque credenziale o rendere pubblico l'URL.

In entrambi i casi: `npx prisma db seed` (o lo script equivalente) contro `DATABASE_URL`/`DIRECT_URL` di produzione.

**Verifiche:**

- Login riuscito con le credenziali di produzione (non quelle di sviluppo).
- Tentativo di login con `CambiamiSubito123` fallisce (conferma che la password nota non è più valida, se si è seguita l'Opzione B).

**Rollback:** pre-lancio, eliminare le righe seminate (Tenant, Utente, Membership, Ruolo, Permesso, FasciaBudget, TipoProgetto, Regola) e rieseguire — nessun rischio, nessun utente reale ancora esposto a questi dati.

---

## Fase 6 — Variabili d'ambiente su Vercel

**Obiettivo:** rendere disponibili tutte le variabili necessarie, separate per ambiente (ADR-0005 §5, checklist punto 5).

**Prerequisiti:** Fasi 2-3 (stringhe di connessione), storage S3 di produzione provisionato (Fase 0).

**Attività:** impostare su Vercel, per l'ambiente **Production** (e separatamente per Preview, se si vuole un database di staging distinto — altrimenti Preview può puntare allo stesso Supabase con cautela):

- `DATABASE_URL` (pooled, porta 6543)
- `DIRECT_URL` (diretta, porta 5432 — usata solo se si eseguono migrazioni da Vercel stesso, altrimenti serve solo in locale)
- `S3_ENDPOINT`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`, `S3_BUCKET` di produzione
- **`SITE_URL`** (es. `https://ramirezatelier.it`) — **requisito operativo, non facoltativo**: usata per costruire ogni link nelle email (recupero password, invito, notifica nuova richiesta, notifica preventivo pronto — v. `src/lib/notifiche/`). Senza questa variabile impostata, ogni link generato sarebbe letteralmente `"undefined/..."` — verificato concretamente, non un'ipotesi.
- variabili del provider email scelto (v. Fase 0) — l'infrastruttura di invio (`InvioEmailAdapter`) è già implementata e in uso (recupero password, inviti, notifiche); resta da collegare l'adattatore per il provider reale scelto, sostituendo quello console usato in sviluppo.

**Verifiche:** `vercel env ls` mostra tutte le variabili attese per l'ambiente Production; nessun valore di sviluppo (localhost, MinIO locale) presente in Production; **`SITE_URL` punta al dominio reale di produzione, non a `localhost`** — inviare un'email di prova (es. un recupero password) e verificare che il link nel messaggio sia quello giusto, non un residuo di sviluppo.

**Rollback:** le variabili si correggono e si ridistribuiscono in qualunque momento senza impatto sui dati — un deploy successivo le raccoglie.

---

## Fase 7 — Collegamento a Vercel e primo deploy

**Obiettivo:** ottenere il primo deploy pubblico (su un URL `*.vercel.app` provvisorio, prima del dominio definitivo).

**Prerequisiti:** Fasi 1 e 6 completate.

**Attività:** importare il repository GitHub in Vercel, confermare il framework rilevato (Next.js) e la build command, avviare il deploy.

**Verifiche:** build completata senza errori nei log Vercel; URL `*.vercel.app` raggiungibile; home page e `/admin/login` rispondono HTTP 200.

**Rollback:** Vercel mantiene la cronologia dei deployment — essendo il primo, un fallimento significa solo correggere e ripetere; da un secondo deploy in poi, Vercel permette il rollback istantaneo a una versione precedente funzionante con un clic.

---

## Fase 8 — Smoke test in produzione

**Obiettivo:** verificare che il sistema funzioni con dati reali di produzione — non solo che la build sia riuscita.

**Prerequisiti:** Fase 7 completata.

**Attività — ripetere manualmente, sull'URL reale, gli stessi controlli usati durante lo sviluppo:**

1. Completare un wizard end-to-end (Cucina o Armadio) fino alla pagina di conferma.
2. Verificare che la stima di prezzo compaia (se una regola di pricing corrisponde) e che il link `/richiesta/[token]` funzioni.
3. Login admin con le credenziali di produzione (cambiate, Fase 5).
4. Verificare che la richiesta appena creata compaia in `/admin/richieste` e nella dashboard.
5. Un tentativo di login con password errata ripetuto 5 volte, poi un sesto con password corretta: deve essere respinto dal rate limiting (conferma che la sicurezza costruita negli Incrementi 5-6 funzioni anche in produzione, non solo in sviluppo).
6. Una chiamata a un endpoint API (es. `/api/richieste`) senza cookie di sessione: deve rispondere 401.

**Verifiche:** tutti i controlli sopra riusciti.

**Rollback:** se qualcosa non funziona e non è la primissima versione, rollback istantaneo al deployment precedente da Vercel; se è la primissima, correggere e ripetere la Fase 7.

---

## Fase 9 — Dominio

**Obiettivo:** collegare `ramirezatelier.it` al progetto Vercel — un solo dominio, nessun sottodominio per `/admin` (ADR-0005 §4).

**Prerequisiti:** dominio già registrato, accesso al pannello DNS del registrar.

**Attività:** aggiungere il dominio in Vercel, configurare i record DNS indicati da Vercel (tipicamente un record A per l'apex e un CNAME per `www`), attendere la propagazione.

**Verifiche:** il dominio reale serve l'app con un certificato TLS valido (emesso automaticamente da Vercel); redirect corretto tra `www` e apex, secondo la preferenza scelta.

**Rollback:** rimuovere il dominio da Vercel e ripristinare i record DNS precedenti — il sito resta comunque raggiungibile su `*.vercel.app` durante l'intera transizione, senza downtime.

---

## Fase 10 — Disciplina operativa (CI, branch protection, monitoraggio)

**Obiettivo:** chiudere gli ultimi punti della checklist di ADR-0005 prima di considerare il lancio davvero completo.

**Prerequisiti:** Fasi precedenti completate; il sito è già pubblico a questo punto — questa fase riguarda la sostenibilità di ciò che viene dopo, non il primo accesso.

**Attività:**

- Creare la pipeline GitHub Actions mancante per Ramirez Atelier (type-check, lint, build su ogni pull request) — oggi esiste solo per ArtigianOS Fase 1, non per questo repository.
- Attivare branch protection su `main`: richiedere che i check CI passino prima di poter fare merge.
- Collegare un servizio di tracciamento errori (es. Sentry, piano gratuito) al progetto Vercel.

**Verifiche:** una pull request di prova mostra i check in esecuzione e blocca il merge se fallissero; un errore generato deliberatamente in un ambiente di test compare nel tracciamento errori.

**Rollback:** nessun rischio — sono controlli aggiuntivi; la loro rimozione, se configurati in modo troppo restrittivo, è immediata.

---

## Cosa NON fare, in sintesi

- Non rendere pubblico il repository confidando che "tanto nessuno lo trova" — la password del seed di sviluppo è un problema reale da chiudere (Fase 5), non un rischio accettabile per omissione.
- Non saltare la Fase 3 (pooling) pensando di "aggiungerlo se serve" — è molto più semplice farlo prima del primo traffico reale che diagnosticare un esaurimento di connessioni in produzione.
- Non usare il rollback drastico della Fase 4 (`DROP SCHEMA`) una volta che esistono utenti reali — a quel punto l'unico rollback accettabile è un restore da backup verificato (Fase 0).
- Non comunicare le credenziali dell'utente amministratore per un canale non sicuro, indipendentemente da quale delle due opzioni della Fase 5 si sceglie.
