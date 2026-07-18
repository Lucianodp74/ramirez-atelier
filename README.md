# Ramirez Atelier — Configuratore Progetti

Sito indipendente per la raccolta strutturata di richieste di progetto (cucine, armadi, living, ...), pensato per essere in futuro assorbito come modulo nativo di ArtigianOS (v. `docs/adr/0001` e `docs/adr/0002` nel repository ArtigianOS per il contesto architetturale completo).

**V1 — nessuna AI.** Nessun OCR, nessuna Computer Vision, nessuna analisi automatica di PDF/DWG/foto. Obiettivo: raccogliere informazioni complete e standardizzate, con una fascia di prezzo indicativa calcolata da regole configurabili — non da un motore "intelligente".

## Stato del progetto

**Incremento 9 — Esperimento "Portale Cliente" minimo, completato e verificato.**

Non è il Portale Cliente/Architetto completo previsto da ADR-0004 — è deliberatamente meno: un esperimento di prodotto per verificare, al minor costo possibile, se i clienti trovano valore nel consultare lo stato della propria richiesta senza dover richiamare in azienda. Se l'uso reale lo conferma, il Portale completo (con vero accesso e storico multi-progetto per gli architetti) diventa una scelta informata, non una scommessa.

- **`/richiesta/[token]`**: pagina pubblica di sola lettura, raggiunta dal `tokenRipresa` già esistente dall'Incremento 2 (il token che oggi serve a riprendere una bozza) — nessuna nuova tabella, nessuna nuova identità, nessun login.
- **Nessuna nuova interfaccia di osservazione**: ogni consultazione genera un `EventoAttivita` (nuovo tipo `STATO_CONSULTATO_DAL_CLIENTE`), visibile automaticamente nella timeline già esistente in `/admin/richieste/[id]` — il titolare vede l'uso reale senza che sia stata costruita alcuna dashboard dedicata.
- **Link permanente mostrato nella pagina di conferma** del wizard, così il cliente può salvarlo.
- **Compromesso di sicurezza dichiarato esplicitamente** (non nascosto): un link "bearer" nell'URL può finire in una cronologia condivisa o in log — accettabile qui perché la pagina è di sola lettura, non permette alcuna azione, ed espone solo lo stato del proprio stesso progetto.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Completa un wizard da `/`: nella pagina di conferma troverai un link "Vuoi controllare a che punto siamo?" — aprilo (anche in una scheda anonima) per vedere lo stato. Poi accedi come `titolare@ramirezatelier.it` e apri quella richiesta in `/admin/richieste/[id]`: vedrai "Il cliente ha consultato lo stato N volte" sopra la cronologia.

### Nota di trasparenza sulla verifica in questo ambiente di sviluppo

Verificato con 5 casi reali contro PostgreSQL: consultazione di una bozza non ancora inviata (nessun evento generato — non è ancora un "cliente" da tracciare), consultazione dopo l'invio con prezzo calcolato correttamente mostrato, consultazioni multiple che incrementano correttamente il conteggio, token inventato che restituisce `null` (mai un errore che riveli l'esistenza o meno di un token altrui), e conferma che la timeline esistente mostra l'evento senza alcuna modifica al componente di visualizzazione. Poi verificato via HTTP reale: pagina pubblica raggiungibile con il token vero, 404 pulito su un token inventato, e la pagina di dettaglio admin che mostra correttamente il contatore — la verifica stessa (una richiesta HTTP di test) è comparsa nella timeline come consultazione reale, chiudendo il cerchio end-to-end. Nessun bug applicativo trovato in questo incremento.

## Stato del progetto (versioni precedenti)

**Incremento 8 — Osservabilità e KPI, completato e verificato. Primo passo verso il Controllo di Gestione.**

Novità rispetto all'Incremento 7:

- **`/admin/kpi`**: valore totale delle opportunità aperte (pipeline), valore medio richiesta, tempo medio dalla richiesta al preventivo inviato, tasso di conversione, richieste per tipologia, richieste per architetto (approssimato, v. nota sotto), distribuzione per fascia di budget dichiarata — con filtro per intervallo di date.
- **Nessuna tabella di snapshot pre-calcolata**: le metriche si calcolano al volo aggregando i dati esistenti. Scelta deliberata: ai volumi di una singola azienda artigiana è la soluzione più semplice che funziona ed è la più facile da verificare — non un compromesso di fretta. Il giorno in cui i volumi lo richiederanno davvero, questo sarà il punto naturale da sostituire con query aggregate lato database.
- **"Tempo medio richiesta → preventivo" usa un evento reale**, non l'istante della stima automatica: il momento in cui lo stato passa a "Preventivo inviato" (un'azione umana, già tracciata nella timeline) — misura la reattività del team, non la velocità del motore di pricing.
- **Sincronizzazione dei permessi nel seed**: il nuovo modulo `kpi` si propaga automaticamente al Ruolo "Proprietario" anche su installazioni già seminate in incrementi precedenti (prima, un nuovo modulo sarebbe rimasto silenziosamente invisibile finché qualcuno non l'avesse assegnato a mano).

**Nota di scope onesta:** "richieste per architetto" è approssimato raggruppando per nome+email tra i clienti con tipo "Architetto" — non esiste ancora un'identità Architetto reale collegabile nel tempo (prevista in ADR-0004 come `IdentitaEsterna` futura, non implementata). Dichiarato esplicitamente anche nella UI, non nascosto.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Accedi come `titolare@ramirezatelier.it` e vai su `/admin/kpi`. Con poche richieste completate a stati diversi (alcune Convertite, alcune ancora aperte, una da un cliente "Architetto"), i numeri riflettono esattamente lo scenario — prova a cambiare stato a qualche richiesta da `/admin/richieste` e ricarica la pagina KPI.

### Nota di trasparenza sulla verifica in questo ambiente di sviluppo

Qui la verifica più importante non era "la pagina si carica senza errori" ma **l'esattezza aritmetica di ogni numero**: ho costruito uno scenario controllato con 5 richieste (valori di prezzo diversi, stati diversi, un cliente Architetto, timestamp manipolati direttamente per simulare giorni trascorsi) e calcolato a mano il valore atteso di ciascun KPI prima di confrontarlo con l'output reale.

**Un bug reale trovato e corretto**: il tasso di conversione contava solo lo stato _attuale_ della richiesta, sottostimando le conversioni — perché il workflow permette di archiviare una richiesta già Convertita a Chiusa (transizione legittima, es. "commessa conclusa e archiviata"), e a quel punto il suo stato corrente non è più "Convertita" pur essendo stata, di fatto, una vendita. Corretto verificando se "Convertita" compare _mai_ nella cronologia degli eventi della richiesta, non solo nel suo stato istantaneo — con un test che include esplicitamente questo scenario (converti, poi chiudi, verifica che conti ancora come conversione).

## Stato del progetto (versioni precedenti)

**Incremento 7 — Motore di Pricing, completato e verificato. Il flusso Richiesta → Analisi → Preventivo è ora completo end-to-end.**

Novità rispetto all'Incremento 6:

- **Motore di Pricing come secondo consumatore reale del Rule Engine** (non un calcolatore a parte): la vecchia tabella `RegolaPrezzo` (Incremento 1, mai realmente interrogata) è stata rimossa e sostituita da righe di `Regola` con contesto `preventivo_pricing` — esattamente il "secondo consumatore" che ADR-0003 poneva come condizione per quella migrazione.
- **Nessuna formula nel dominio**: le condizioni delle regole di prezzo lavorano direttamente sui dati grezzi raccolti dal wizard (centimetri, materiale scelto) usando gli operatori di intervallo già esistenti nel motore (`tra`, `maggiore_uguale`, `minore`) — nessun bucketing "piccola/media/grande" calcolato a priori nel codice.
- **Fact-builder condiviso** (`src/lib/richiesta-fatti.ts`): un'unica funzione traduce una richiesta in fatti valutabili dal motore, usata sia per la priorità commerciale sia per il pricing — eliminata la duplicazione della logica di merge dati riservati/JSON che prima viveva in due punti diversi.
- **Risoluzione dei conflitti tra regole, risolta** (era esplicitamente rimandata nell'Incremento 4 "finché un secondo consumatore non l'avesse resa necessaria" — ora lo è): `eseguiRegolePerContesto` supporta `fermaAlPrimoMatch` (default `true`), che interrompe la valutazione alla prima regola con condizione vera, nell'ordine di priorità — la regola più specifica vince.
- **Il cliente vede finalmente una stima**: la pagina di conferma del wizard mostra la fascia di prezzo indicativa calcolata, se una regola ha trovato corrispondenza (mai un prezzo inventato se nessuna regola matcha).
- **La dashboard mostra numeri reali**: "valore economico stimato" (Incremento 3, sempre "non disponibile" finché il pricing non esisteva) ora si popola con la somma delle fasce di prezzo calcolate.
- **Tracciabilità**: `regolaPrezzoApplicataId` collega ogni richiesta prezzata alla Regola che ha prodotto quel risultato, visibile nella sezione "Regole applicate" già esistente.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

1. Completa un wizard da `/` scegliendo Cucina, indicando una larghezza e un materiale
2. Nella pagina di conferma vedrai la stima indicativa ("Prima stima indicativa")
3. Accedi come `titolare@ramirezatelier.it` e apri la richiesta in `/admin/richieste`: fascia di prezzo e regola applicata sono visibili nel dettaglio
4. La home della dashboard ora mostra un "valore economico stimato" reale, non più "non disponibile"

### Nota di trasparenza sulla verifica in questo ambiente di sviluppo

Stessa metodologia degli incrementi precedenti. Verificato con 7 casi reali contro PostgreSQL, pensati per mettere alla prova specificamente priorità e specificità delle regole: cucina grande in pietra (regola più specifica, priorità 40), stessa dimensione ma materiale diverso (nessuna regola specifica corrisponde, cade sul fallback generico — non prende per errore la regola "pietra"), cucina media in rovere (deve prendere "media premium", non "media standard", nonostante entrambe abbiano `larghezzaCm` nell'intervallo), stessa dimensione in laminato (deve prendere "media standard"), cucina piccola, cucina senza dimensioni indicate, e tracciabilità (`regolaPrezzoApplicataId` punta davvero alla regola che ha deciso il prezzo). Poi verificato via HTTP reale: pagina di conferma cliente con la stima visibile, dashboard con "valore economico stimato" popolato, dettaglio richiesta con prezzo e regola applicata.

**Un bug reale trovato e corretto nel motore stesso** (non nell'adattatore di verifica, nel Rule Engine): il caso "richiesta senza dimensioni indicate" restituiva la fascia di prezzo per cucine _piccole_ invece del fallback generico. Causa: `Number(null)` in JavaScript vale `0`, quindi un fatto assente veniva silenziosamente trattato come "larghezza 0 cm", facendo scattare la condizione "minore di 250". Corretto negli operatori numerici del valutatore: un fatto assente ora rende sempre falsa la condizione, mai un match per coincidenza aritmetica — con un test dedicato che verifica anche il caso opposto (un valore _davvero_ zero non va confuso con un valore assente).

## Stato del progetto (versioni precedenti)

### Come provare la demo (in aggiunta a quanto già descritto per gli Incrementi 1-5)

1. Accedi come `titolare@ramirezatelier.it` e vai su `/admin/utenti`
2. Invita una nuova persona: il link di accettazione compare a schermo (l'invio email reale non è ancora integrato)
3. Apri il link in una scheda anonima, scegli nome e password, accetta
4. Prova a sbagliare la password del titolare 5 volte di fila, poi riprova con quella corretta: viene comunque respinta per qualche minuto

### Nota di trasparenza sulla verifica in questo ambiente di sviluppo

Stessa metodologia degli incrementi precedenti. Verificato con 7 casi reali contro PostgreSQL: rate limiting (incluso il caso critico — la password _corretta_ al sesto tentativo viene comunque respinta), ciclo di vita completo di un invito per una persona nuova (creazione, tentativo senza dati rifiutato, accettazione con nome+password, login con la password scelta), rifiuto del riutilizzo di un invito già accettato, invito verso una persona **già esistente su un altro tenant** (nessuna nuova password richiesta, semplice aggiunta di una seconda Membership — verificato che ne risultino 2 in totale), revoca di un invito pendente. Nessun bug applicativo trovato in questo incremento.

## Stato del progetto (versioni precedenti)

**Incremento 5 — Identity & Security, completato e verificato. La nota di sicurezza degli incrementi precedenti è risolta: `/admin` ora richiede autenticazione.**

Novità rispetto all'Incremento 4:

- **Modello Identity & Security completo** secondo ADR-0004 v1.1 (repository ArtigianOS): `Tenant`, `Utente` (identità globale, non tenant-scoped), `Membership` (relazione Utente↔Tenant con ruolo, permette a una persona di collaborare con più aziende contemporaneamente), `Ruolo`/`Permesso` (RBAC come dati, non hardcoded), `Sessione` (token opaco server-side, mai JWT), `Invito`, `RichiestaRecuperoPassword`, `EventoSicurezza` (audit trail dedicato)
- **`tenantId` retroattivo su tutte le tabelle di business** (TipoProgetto, RichiestaProgetto, FasciaBudget, Regola, RegolaPrezzo) — non solo le tabelle di identità: nessun servizio opera senza conoscere il Tenant corrente (vincolo esplicito)
- **Autenticazione**: login email/password (Argon2id), logout con revoca server-side, recupero password (token monouso a scadenza breve — invio email non ancora integrato, v. sotto)
- **`/admin/login`** + layout protetto (route group `(protetto)`) che reindirizza al login se la sessione non è valida
- **Autorizzazione solo lato server**: ogni pagina, Server Action e API route invoca `richiediContesto(modulo, azione)` prima di qualunque operazione — verificato che un frontend "generoso" non basti, serve il controllo server (Principio esplicito)
- **Cambio Tenant attivo** senza nuova autenticazione (`/api/auth/cambia-tenant`) — per chi ha più Membership
- **Wizard pubblico** (clienti, non autenticati) associato al Tenant "well-known" di Ramirez Atelier (`idTenantRamirezAtelier()`) — nessuna riga di business esiste senza un Tenant, nemmeno quella creata da un cliente anonimo

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Il seed crea un utente amministratore: **`titolare@ramirezatelier.it`** / **`CambiamiSubito123`** — cambiarla al primo accesso reale.

1. Vai su `http://localhost:3000/admin` → reindirizzato a `/admin/login` (nessuna sessione)
2. Accedi con le credenziali sopra → dashboard operativa, con nome utente e azienda in alto a destra
3. Prova a chiamare `curl http://localhost:3000/api/richieste` senza cookie: risposta 401
4. Completa un wizard da `/` come cliente (nessun login necessario) e verifica che la richiesta compaia comunque nella dashboard, correttamente associata al Tenant Ramirez Atelier

### Nota di trasparenza sulla verifica in questo ambiente di sviluppo

Stessa metodologia degli incrementi precedenti (adattatore locale di `@prisma/client`, mai spedito — esteso in questo incremento con tutti i modelli Identity & Security). Verifica in due fasi:

1. **13 casi a livello di servizio** contro PostgreSQL reale: login riuscito/fallito/email inesistente (stesso messaggio, no enumerazione), recupero sessione, permesso concesso/negato, **isolamento cross-tenant** (una richiesta di un tenant concorrente è invisibile, sia in dettaglio sia in elenco), **stessa persona con due Membership su due aziende diverse** (il cuore della revisione ADR-0004), cambio Tenant attivo riuscito/fallito, **revoca Membership che invalida immediatamente le sessioni** su quel Tenant, logout con revoca reale, audit trail completo.
2. **9 verifiche via HTTP reale** (non solo chiamate dirette ai servizi): redirect al login senza sessione, 401 sulle API senza cookie, 401 su password errata, login che imposta un cookie httpOnly, accesso autenticato alla dashboard, API autenticata, endpoint sessione corrente, logout, **conferma che lo stesso cookie non funzioni più subito dopo il logout**.

**Tre bug reali trovati e corretti nel processo** (nell'adattatore di verifica, non nel codice applicativo — ma segnalati comunque per trasparenza): l'adattatore forzava una colonna `id` anche sulla tabella `membership_ruolo`, che ha chiave primaria composita; mancava il metodo `create` sul modello `tipoProgetto`; il pacchetto `pg` (usato solo dall'adattatore) era stato rimosso da un'installazione npm successiva perché non salvato nel `package.json` — reinstallato e segnalato come rischio ricorrente di questo approccio di verifica.

Oltre ai limiti di rete già documentati (`ui.shadcn.com`, `binaries.prisma.sh`, Google Fonts): stesso limite non aggirabile sul click-through browser reale, mitigato come sempre verificando ogni funzione sottostante con dati reali.

**Threat Model:** v. [`THREAT-MODEL.md`](./THREAT-MODEL.md) — asset, attori, superfici di attacco, minacce e contromisure, rischi esplicitamente rimandati (rate limiting, Row-Level Security, invio email reale, MFA/SSO/API Key).

**Infrastruttura e deployment:** v. ADR-0005 nel repository ArtigianOS — repository separati vs monorepo, scelta di Vercel/Supabase motivata, organizzazione dei domini, checklist esplicita di cosa completare prima della prima pubblicazione reale e cosa rimandare (con il trigger che ne giustifica il rinvio).

**Piano di pubblicazione:** v. [`DEPLOY-RUNBOOK.md`](./DEPLOY-RUNBOOK.md) — piano operativo fase per fase dal repository locale al primo deploy pubblico, con verifiche e rollback per ciascuna fase.

## Cosa NON contiene ancora

Row-Level Security PostgreSQL per l'isolamento tra Tenant (oggi applicativo, disciplinato ma non garantito dal database), invio reale delle email (recupero password, inviti, e ora anche il link del Portale Cliente — tutti risolvibili insieme da un futuro modulo Notifiche, v. Architecture Roadmap nel repository ArtigianOS), rotazione periodica del token di sessione, MFA/SSO/OAuth/API Key (deliberatamente rimandati, v. ADR-0004 §12 e [`THREAT-MODEL.md`](./THREAT-MODEL.md)). Pannello di gestione delle regole di pricing/business da interfaccia. Identità Architetto/Cliente reale (`IdentitaEsterna` di ADR-0004 — l'Incremento 9 è un esperimento a basso costo per validare se vale la pena costruirla, non la sua implementazione). `eliminaDocumento` rimuove solo il riferimento nel database, non il file dallo storage. Pagina di richiesta/reset password lato UI.

## Stack tecnologico

| Livello        | Scelta                                                                        |
| -------------- | ----------------------------------------------------------------------------- |
| Framework      | Next.js 15 (App Router) + React 19 + TypeScript                               |
| Styling        | Tailwind CSS v4 + componenti shadcn/ui (scritti a mano, v. nota Incremento 1) |
| Database       | PostgreSQL 16                                                                 |
| ORM            | Prisma                                                                        |
| Object Storage | S3-compatible (MinIO in locale, provider reale in produzione)                 |
| Validazione    | Zod                                                                           |
| Container      | Docker (build standalone) + docker-compose                                    |
| CI             | GitHub Actions                                                                |

## Avvio in locale

Prerequisiti: Node.js 20+, PostgreSQL 16 (o Docker).

```bash
npm install
cp .env.example .env   # e aggiorna DATABASE_URL se necessario

npx prisma migrate dev   # applica le migrazioni
npx prisma db seed       # popola i tipi di progetto (Cucina, Armadio) e le regole prezzo

npm run dev
# http://localhost:3000
```

## Avvio con Docker

```bash
cp .env.example .env
docker compose up --build
# App:   http://localhost:3000
# MinIO: http://localhost:9001 (console)
```

## Comandi disponibili

```bash
npm run dev              # sviluppo
npm run build            # build produzione (standalone)
npm run lint              # ESLint
npm run format            # Prettier (scrive)
npm run format:check      # Prettier (verifica soltanto)
npm run type-check        # tsc --noEmit
npm run prisma:generate   # genera il Prisma Client
npm run prisma:migrate    # nuova migrazione in sviluppo
npm run prisma:seed       # esegue prisma/seed.ts
```

## Architettura dati — principio chiave

Il configuratore **non ha campi hardcoded per tipo di progetto**. Ogni `TipoProgetto` (Cucina, Armadio, Living, Bagno, ...) è definito da una configurazione JSON (step, campi, pesi di completezza, validazioni dichiarative, campi rilevanti per il pricing) validata a runtime con Zod (`src/lib/tipo-progetto-schema.ts`). Aggiungere un nuovo tipo di progetto è un'operazione di dati (una riga in tabella + regole di prezzo), mai una modifica di codice — lo stesso principio già adottato in ArtigianOS per `TemplateProdotto` (Bounded Context Marketplace).

Il componente wizard (`src/components/wizard/ConfiguratoreWizard.tsx` + `CampoRenderer.tsx`) non contiene alcun riferimento a "cucina", "armadio" o qualunque altro tipo di progetto: interpreta esclusivamente la struttura ricevuta.

Nomi delle entità (`RichiestaProgetto`, `StatoRichiesta`, ...) scelti deliberatamente per essere compatibili con il futuro Aggregate `RichiestaPreventivo` di ArtigianOS, per rendere la futura integrazione un'operazione di migrazione dati, non una riscrittura (v. ADR-0002).

## Prossimo incremento

Da decidere in base ai risultati dell'esperimento Incremento 9: se l'uso reale del link di stato conferma interesse, il passo naturale è il Portale Cliente/Architetto completo (ADR-0004, `IdentitaEsterna`). In parallelo restano aperti: modulo Notifiche (risolverebbe insieme più debiti email), Row-Level Security PostgreSQL, CRM. V. Architecture Roadmap nel repository ArtigianOS per il quadro completo.
