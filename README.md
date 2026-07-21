# Ramirez Atelier — Configuratore Progetti

Sito indipendente per la raccolta strutturata di richieste di progetto (cucine, armadi, living, ...), pensato per essere in futuro assorbito come modulo nativo di ArtigianOS (v. `docs/adr/0001` e `docs/adr/0002` nel repository ArtigianOS per il contesto architetturale completo).

**V1 — nessuna AI.** Nessun OCR, nessuna Computer Vision, nessuna analisi automatica di PDF/DWG/foto. Obiettivo: raccogliere informazioni complete e standardizzate, con una fascia di prezzo indicativa calcolata da regole configurabili — non da un motore "intelligente".

## Stato del progetto

**Notifiche — Incremento 4: il cliente avvisato quando il preventivo è pronto. Capitolo Notifiche chiuso per ora.**

Non un'estensione del Portale Cliente — un completamento di un flusso già esistente. La pagina pubblica (`/richiesta/[token]`) mostra già tutto il necessario dall'Incremento 9; mancava solo l'avviso che dicesse al cliente di andare a guardarla. Quando una richiesta transita a `PREVENTIVO_INVIATO` (l'unica transizione che porta a questo stato — v. `workflow.ts`), il cliente riceve un'email con il link diretto, riusando lo stesso `tokenRipresa` già in uso per il wizard.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Completa un wizard, poi da `/admin/richieste/[id]` porta lo stato fino a "Preventivo inviato": l'email al cliente compare nel terminale (adattatore console).

### Stato di verifica di questo incremento

- **Bug applicativi**: nessuno.
- **Problemi di progettazione**: nessuno.
- **Promesse architetturali verificate**: nessuna nuova — quarta volta di seguito che `InvioEmailAdapter` viene riusato così com'è. Il fatto che regga identico al quarto punto di collegamento diverso (recupero password, invito, nuova richiesta, preventivo pronto) è di per sé un segnale positivo sulla qualità dell'astrazione, ma non lo forzo a diventare una "scoperta di dominio" — è un vantaggio tecnico ripetuto, non un concetto del mestiere che si rivela in un contesto nuovo.
- **Test di falsificazione scelto per questo incremento**: la promessa era "il cliente riceve il link corretto al proprio preventivo, e solo quando è realmente disponibile". Verificato in due parti: (1) nessuna email al cliente sulla transizione NUOVA→IN_REVISIONE, solo su IN_REVISIONE→PREVENTIVO_INVIATO; (2) **due richieste di clienti diversi, portate a PREVENTIVO_INVIATO in ordine invertito rispetto alla loro creazione** — verificato che ciascun cliente ricevesse il link con il proprio token esatto, mai quello dell'altro. Nessun incrocio.

Con questo, il capitolo Notifiche è considerato sostanzialmente concluso per il perimetro attuale — si riprende solo se una futura necessità reale lo richiede, non per completare un elenco.

## Stato del progetto (versioni precedenti)

**Notifiche — Incremento 3: lo staff avvisato di ogni nuova richiesta.**

Terzo pezzo della stessa infrastruttura: quando un cliente completa il wizard, ogni membro dello staff con Membership attiva nel tenant riceve un'email — nome del cliente, tipo di progetto, fascia di prezzo stimata (se una Regola ha già dato un risultato), link diretto alla richiesta. Nessuna configurazione "chi vuole essere avvisato": a questa scala (1-3 persone in un atelier piccolo) non produce alcun beneficio reale, sarebbe un'opzione in cerca di un problema.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Completa un wizard pubblico fino in fondo — nel terminale dove gira `npm run dev` comparirà l'email di notifica per il titolare (adattatore console).

### Stato di verifica di questo incremento

- **Bug applicativi**: nessuno.
- **Problemi di progettazione**: nessuno nuovo.
- **Promesse architetturali verificate**: nessuna nuova — `InvioEmailAdapter` riusato com'era, terza volta di seguito. Riuso di codice ordinario, non lo forzo a sembrare altro.
- **Test di falsificazione scelto per questo incremento**: il rischio concreto di notificare la persona sbagliata — creato un secondo membro dello staff **sospeso** insieme a uno attivo, verificato che la notifica raggiunga esattamente il titolare e lo staff attivo (due email), mai quello sospeso — confermato: zero email verso l'indirizzo sospeso.

## Stato del progetto (versioni precedenti)

**Notifiche — Incremento 2: invito utente, secondo pezzo dello stesso debito.**

Stessa forma esatta del debito già chiuso per il recupero password: `creaInvito` generava un link che il titolare doveva copiare e condividere a mano. Ora l'invito viene inviato via email (adattatore console in sviluppo, stesso `InvioEmailAdapter` già costruito) — nessuna nuova infrastruttura, solo un secondo punto collegato a quella già esistente.

- **Un problema di progettazione trovato non da un test, ma applicando la stessa domanda di falsificazione già usata per il recupero password**: `creaInvito`, a differenza di `richiediRecuperoPassword`, non invalidava gli inviti precedenti non ancora accettati per la stessa email. Un titolare che invita due volte la stessa persona (es. per correggere un ruolo sbagliato) avrebbe lasciato **entrambi** i link validi contemporaneamente — un vecchio invito con un ruolo superato sarebbe rimasto accettabile per sempre. Corretto con lo stesso meccanismo già in uso per il recupero password (invalidazione delle richieste precedenti non ancora usate), non scoperto dall'uso reale ma dal chiedersi esplicitamente "questa stessa promessa vale anche qui?"

### Stato di verifica di questo incremento

- **Bug applicativi**: nessuno.
- **Problemi di progettazione**: uno, descritto sopra — un'incoerenza tra due meccanismi che avrebbero dovuto seguire la stessa regola, trovata prima che un titolare la scoprisse invitando qualcuno due volte per errore.
- **Promesse architetturali verificate**: nessuna nuova in questo incremento — `InvioEmailAdapter` è stato riusato così com'era, senza bisogno di alcuna estensione. Riuso di codice ordinario, non una nuova scoperta di dominio, e va bene dirlo così.
- **Test di falsificazione scelto per questo incremento**: due inviti consecutivi alla stessa email — verificato che il primo, mai accettato, diventi correttamente invalido non appena arriva il secondo, e che il secondo funzioni. Stessa struttura di test già usata per il recupero password, applicata qui perché la correzione appena fatta lo richiedeva direttamente.

## Stato del progetto (versioni precedenti)

**Notifiche — Incremento 1: recupero password, dal debito dichiarato al ciclo reale.**

Il primo pezzo del debito segnalato fin dall'inizio ("password admin ancora in chiaro nel seed", "l'invio email non è ancora integrato"): il recupero password oggi genera davvero un'email, e l'intero ciclo — richiesta, link, nuova password, invalidazione del vecchio link — è stato verificato con chiamate HTTP reali, non solo con la lettura del codice.

- **`InvioEmailAdapter`**, stesso pattern già usato per lo storage documenti (`StorageAdapter`): un varco generico, non un provider indovinato in anticipo. Oggi esiste solo l'adattatore console (nessun invio reale, scrive nel log del server) — quando si sceglierà un provider reale (Resend, Postmark, SMTP), si aggiungerà un secondo adattatore con la stessa interfaccia, non prima.
- **Le due pagine mancanti, non solo l'invio**: inviare un'email con un link che non porta a nessuna pagina sarebbe stato peggio che non inviarla affatto. Aggiunte `/admin/recupera-password` (richiesta) e `/admin/recupera-password/[token]` (nuova password), più il link "Password dimenticata?" nella pagina di login — altrimenti il ciclo sarebbe stato raggiungibile solo a chi conosce già l'URL.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Da `/admin/login`, clicca "Password dimenticata?", inserisci `titolare@ramirezatelier.it`. L'email non viene inviata per davvero (adattatore console) — il link compare nel terminale dove gira `npm run dev`. Copialo e incollalo nel browser per completare il recupero.

### Stato di verifica di questo incremento

- **Bug applicativi**: nessuno trovato.
- **Problemi di progettazione**: nessuno nuovo in questo incremento (a differenza del precedente, dove il problema del token via URL era stato trovato durante la progettazione stessa).
- **Promesse architetturali verificate**: il pattern adattatore (`StorageAdapter`) si è dimostrato un **riutilizzo di modello del dominio**, non solo di codice — "un varco generico per una capacità che dipenderà da un provider esterno, deciso più avanti" si è rivelato applicabile pari pari a un problema completamente diverso (email invece di file), senza alcuna modifica concettuale. Non forzo altre osservazioni di questo tipo dove non ci sono: il resto dell'incremento è riuso di codice ordinario (i componenti UI di login/form), e va bene dirlo così.
- **Test di falsificazione scelto per questo incremento**: la promessa esplicita nel codice — "una nuova richiesta invalida quelle precedenti non ancora usate" — messa alla prova richiedendo il recupero **due volte di seguito** senza mai usare il primo link. Verificato che il primo token, mai usato, diventi comunque invalido non appena arriva il secondo; verificato anche il ciclo completo end-to-end (vecchia password valida prima, invalida dopo; nuova password funzionante; token non riusabile una seconda volta).

## Stato del progetto (versioni precedenti)

**CRM — Incremento 5: la relazione con il cliente, non l'anagrafica.**

Nato da una simulazione esplicita della giornata di un titolare (40 preventivi/mese: cliente nuovo, cliente storico che richiama, telefonata, recupero di un vecchio preventivo, "qualcosa di simile a quel lavoro", verifica se un lavoro è confermato) — non da un elenco di funzionalità CRM generiche. Ogni pezzo di questo incremento risponde a una frizione reale identificata in quella simulazione, nient'altro.

- **`Cliente` come entità propria**, con deduplica deterministica su email o telefono — **mai sul nome**: due persone omonime restano due clienti distinti, verificato esplicitamente (v. sotto). Un cliente viene creato solo quando una richiesta è davvero completata, non per ogni bozza abbandonata.
- **`/admin/clienti/[id]` è centrata sulla cronologia del rapporto, non su una scheda anagrafica** — l'intestazione con nome/contatti è compatta e sullo sfondo; il centro della pagina sono le richieste collegate (come card cliccabili) e una **cronologia aggregata di eventi attraverso tutte le sue richieste**, riusando `EventoAttivita` e `TimelineEventi` già esistenti (estesi con un'etichetta per richiesta), non una nuova infrastruttura.
- **Ricerca estesa al telefono** in `/admin/clienti` — la lacuna esatta che rompeva l'episodio della telefonata nella simulazione.
- **"Usa questo preventivo come punto di partenza"** (non "Duplica"), su `/admin/richieste/[id]`: crea una nuova bozza con le stesse scelte tecniche ma senza alcun dato del cliente originale (nella pratica serve più spesso per un cliente diverso). Riusa il meccanismo di ripresa bozza del wizard pubblico, esteso per accettare un token esplicito via URL (`?bozza=...`) invece del solo cookie — necessario perché un link generato in admin non ha il cookie del cliente originale.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Completa due wizard con la stessa email per due clienti "diversi" (stesso nome, email diversa) e verifica in `/admin/clienti` che restino separati. Da `/admin/richieste/[id]`, prova "Usa come punto di partenza": apri il link risultante per vedere la bozza precompilata.

### Stato di verifica di questo incremento

- **Bug applicativi**: nessuno trovato.
- **Problemi di progettazione**: uno, risolto prima di scrivere il codice della UI — il link "usa come punto di partenza" generato in admin non avrebbe avuto il cookie di sessione del wizard pubblico (creato per il browser del cliente, non per quello del titolare). Risolto estendendo il meccanismo di ripresa bozza per accettare un token esplicito via query string, con priorità sul cookie.
- **Promesse architetturali verificate**: la cronologia aggregata (`EventoAttivita` esteso a più richieste dello stesso cliente) funziona con dati reali, confermando che l'infrastruttura di eventi costruita fin dall'Incremento 3 di Preventivazione era genuinamente riusabile oltre il suo scopo originale.
- **Test di falsificazione scelto per questo incremento**: il principio esplicitamente confermato — "meglio due clienti distinti che una fusione automatica sbagliata" — messo alla prova con due persone dallo **stesso identico nome** ma contatti diversi. Verificato che restano due Cliente separati; verificato anche il caso opposto (stessa email, stesso nome → correttamente unificati) e un caso ambiguo (primo contatto solo telefono, secondo solo email diversa → restano distinti, coerente col principio: senza un identificatore in comune reale, meglio non unire).

## Stato del progetto (versioni precedenti)

**Catalogo Tecnico — Incremento 4: Stili di partenza (Variante Preimpostata).**

Deviazione deliberata dal piano di implementazione originale (che prevedeva "Emergenza di Modello" come prossimo passo): applicando i principi già stabiliti (Configurazione a Valore, Premature Modeling), costruire Modello ora avrebbe prodotto zero valore osservabile — nessun bisogno reale di più linee di prodotto per ambiente esiste oggi. Gli Stili di partenza, invece, danno valore immediato: il cliente parte da una combinazione già pensata invece che da zero, il titolare ha un vero strumento di vendita. Agganciati direttamente a `TipoProgetto`, non a un `Modello` che non serve ancora costruire.

- **`/admin/catalogo/varianti`**: il titolare crea stili con un nome, una descrizione, e — solo per i campi guidati da catalogo (materiale, ferramenta...) — un menu con "non specificato" di default. Nessun JSON da scrivere a mano.
- **Wizard pubblico**: nuovo primo step "Da dove vuoi partire?", mostrato solo se esistono stili attivi per quel tipo di progetto (altrimenti saltato in silenzio — Progressive Disclosure). La selezione precompila i campi corrispondenti, sempre modificabili liberamente dopo.
- **Nessun controllo d'uso sulla cancellazione**: a differenza di Finitura/Ferramenta/Accessorio, una Variante non è mai referenziata per id dai valori salvati — cancellarla non altera lo storico.

### Report dell'incremento (bug / progettazione / promesse verificate / promesse in attesa)

**Bug applicativi — uno trovato e corretto, tramite il test di falsificazione di questo incremento:** la selezione di uno stile salvava solo il riferimento (`variantePreimpostataId`), non i valori stessi (`datiFormJson`). Un cliente che avesse scelto uno stile e chiuso il browser prima di attraversare gli step "materiali"/"ferramenta" avrebbe perso silenziosamente quei valori — la stessa garanzia di "nessuna perdita di dati" già promessa per ogni altro step del wizard non reggeva qui. Verificato il problema con un test diretto (creare una richiesta, selezionare una variante, verificare lo stato salvato sul server senza attraversare altri step: `datiFormJson` risultava vuoto), corretto facendo persistere subito anche i valori fusi nel `datiFormJson` esistente, e riverificato con lo stesso identico test fino a conferma.

**Problemi di progettazione:** nessuno — la scelta di agganciare le Varianti a `TipoProgetto` invece che a `Modello` è stata presa consapevolmente prima di scrivere codice, non scoperta durante la verifica.

**Promesse architetturali verificate:** Progressive Disclosure sullo step del wizard (Armadio, con una sola variante seminata, la mostra comunque — nessuna soglia minima nascosta); la garanzia di "nessuna perdita di dati" del wizard, che si è rivelata NON coprire ancora questo caso specifico finché non l'ho corretta (v. sopra) — ora la copre, verificata con un test dedicato.

**Promesse architetturali ancora non verificabili:** l'idea che "Modello" possa emergere in futuro riagganciando le Varianti esistenti con una migrazione dedicata resta teoria — nessun bisogno reale l'ha ancora richiesta, e va bene così: non verrà costruita finché non lo farà.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Apri `/progetti/cucina`: il primo step del wizard è ora "Da dove vuoi partire?", con due stili proposti. Da admin, `/admin/catalogo/varianti` per crearne di nuovi o modificarli.

## Stato del progetto (versioni precedenti)

**Catalogo Tecnico — Incremento 3: Ferramenta e Accessori.**

Stesso pattern già verificato per le Finiture, esteso a due nuove entità del Catalogo Tecnico (ADR-0006 §3.5, §3.6). Le opzioni statiche di "ferramenta preferita" (Cucina) e "configurazione interna" (Armadio) sono sostituite da due cataloghi condivisi e gestibili da interfaccia.

- **Generalizzazione, non duplicazione**: con tre casi reali della stessa forma (Finitura, Ferramenta, Accessorio), la logica comune — generazione slug, calcolo automatico dell'ordinamento, controllo d'uso prima della cancellazione — è stata estratta in `catalogo-comune.ts`; i componenti di interfaccia (`FormCatalogoSemplice`, `RigaCatalogoSemplice`) sono generici, non copiati tre volte. Non fatto prima con un solo caso (Finitura): un'estrazione prematura sarebbe stata la stessa scorciatoia già evitata altrove nel progetto.
- **Nessun campione visivo per Ferramenta/Accessorio**: a differenza delle Finiture, non rappresentano superfici — un colore non descriverebbe onestamente una cerniera o una scarpiera (Configurazione a Valore: niente campi che non aggiungono comprensione reale).
- **L'indice del Catalogo (`/admin/catalogo`) ora mostra davvero le tre card**, senza che sia stata toccata la logica di redirect costruita nella simulazione precedente: con una sola sezione reindirizzava automaticamente, con tre mostra l'elenco — esattamente il comportamento previsto, verificato ora che la condizione è cambiata.
- **Verifica di non-regressione esplicita**: rifatti gli stessi test dell'Incremento 2 sulle Finiture dopo il refactoring, per confermare che estrarre la logica comune non ne abbia alterato il comportamento.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Accedi come `titolare@ramirezatelier.it`, vai su "Catalogo" — ora mostra tre sezioni. Completa un wizard Cucina fino allo step "Ferramenta preferita" per vedere il nuovo catalogo, o un wizard Armadio fino a "Come vuoi organizzarlo internamente" per vedere gli Accessori.

### Nota di trasparenza sulla verifica in questo ambiente di sviluppo

Verificato in tre passaggi: (1) migrazione applicata e verificata su Postgres reale per entrambe le nuove tabelle; (2) 5 casi reali — non-regressione sulle Finiture dopo il refactoring (slug generato identico a prima), slug di una Ferramenta stabile anche dopo una rinomina completa, cancellazione bloccata per una Ferramenta già usata in una richiesta reale, disattivazione/cancellazione corrette per un Accessorio mai usato; (3) simulazione di utilizzo reale via HTTP — login, indice del Catalogo con le tre card (non più un redirect), entrambe le nuove pagine popolate con i dati del seed, e verifica diretta che il wizard risolva correttamente le nuove fonti per Cucina (6 ferramenta, incluso un residuo di test poi ripulito) e Armadio (3 accessori).

Nessun bug applicativo trovato in questo incremento — la generalizzazione della logica comune non ha introdotto regressioni, confermato dai test mirati.

## Stato del progetto (versioni precedenti)

**Catalogo Tecnico — Incremento 2, chiuso dopo simulazione di utilizzo reale.**

Nuova regola di processo adottata da questo punto in poi: **ogni incremento si considera concluso solo dopo aver superato una simulazione di utilizzo reale** ("mi metto nei panni del titolare"), non solo dopo che il codice passa i controlli automatici. La prima applicazione di questa regola ha trovato due problemi reali che né il type-check né i test avrebbero mai potuto trovare, perché erano problemi di flusso, non di correttezza del codice.

- **La pagina indice `/admin/catalogo` obbligava a un click su una pagina con una sola card cliccabile.** Corretto: quando esiste una sola sezione del Catalogo, `/admin/catalogo` reindirizza automaticamente ad essa (verificato: HTTP 307 → `/admin/catalogo/finiture`). Quando una seconda sezione (Ferramenta, Accessori...) verrà aggiunta, la pagina smetterà da sola di reindirizzare e mostrerà davvero le card — senza bisogno di toccare il codice: la complessità emerge dal contenuto (Progressive Disclosure), non da un interruttore manuale.
- **Il campo "Ordine" nel form di creazione chiedeva al titolare un numero che non poteva sapere in anticipo** (bisognerebbe già conoscere l'ordinamento delle altre finiture della stessa categoria). Corretto: alla creazione il campo non compare più, il server calcola automaticamente la posizione in coda alla categoria (verificato: una nuova finitura in "legno" con 3 esistenti riceve ordinamento 4). Il campo resta disponibile solo in modifica, per chi vuole davvero riordinare dopo aver visto il catalogo popolato.

Entrambe le correzioni sono state trovate ripercorrendo lo stesso scenario completo della simulazione precedente (primo accesso → scoperta Catalogo → consultazione → aggiunta → modifica → disattivazione → effetto sul wizard → ritorno alla dashboard), questa volta con verifiche HTTP reali passo per passo, non solo a memoria di cosa era stato costruito.

### Nota di trasparenza sulla verifica in questo ambiente di sviluppo

Oltre alle solite verifiche (type-check, lint, build), questa volta la parte più importante è stata comportamentale: login reale, chiamata HTTP a `/admin/catalogo` con conferma del redirect (HTTP 307, non solo assunto), disattivazione di una finitura reale tramite la stessa funzione usata dal pulsante dell'interfaccia con conferma che il wizard pubblico rifletta il cambiamento immediatamente (da 11 a 10 opzioni), e creazione di una finitura senza specificare l'ordinamento con conferma del calcolo automatico corretto.

## Stato del progetto (versioni precedenti)

**Catalogo Tecnico — Incremento 2: gestione completa delle Finiture da interfaccia.**

Nato da una verifica esplicita di esperienza reale (simulazione "titolare apre l'app per la prima volta"), che ha rivelato un problema serio nell'Incremento 1: il catalogo dava valore al cliente ma il titolare non aveva alcun modo di vederlo o modificarlo. Chiuso qui, con la struttura pensata come definitiva (non una soluzione temporanea da riscrivere) — un menu **Catalogo**, oggi con la sola sezione Finiture, pronto ad ospitare Ferramenta/Accessori/Modelli/Varianti quando emergeranno, senza restrutturare nulla.

- **`/admin/catalogo`**: indice del Catalogo Tecnico. **`/admin/catalogo/finiture`**: creare, modificare, disattivare/riattivare, cancellare.
- **Lo slug tecnico non è mai un campo visibile al titolare** — generato automaticamente dal nome alla creazione e **congelato per sempre**, anche se il nome commerciale cambia in seguito: le Regole di pricing lo referenziano direttamente e non devono mai rompersi per un restyling del catalogo (verificato).
- **La categoria è un menu con le categorie già in uso + "nuova categoria"**, mai testo libero puro — evita che il catalogo si frammenti per errori di battitura, restando comunque dato e non un elenco scritto nel codice.
- **Cancellazione bloccata se la finitura è già stata usata in una richiesta**, con messaggio esplicito che guida verso la disattivazione — lo storico resta sempre integro. Verificato che una finitura mai usata si cancelli senza problemi, e che una già usata resti comunque disattivabile.
- **Nuovo permesso `catalogo: leggi/gestisci`**, propagato automaticamente al Ruolo "Proprietario" tramite il meccanismo di sincronizzazione già costruito nell'Incremento 8 — nessun intervento manuale necessario.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Accedi come `titolare@ramirezatelier.it`, vai su "Catalogo" nella barra di navigazione → "Finiture". Prova ad aggiungerne una nuova, modificarne una esistente (il nome cambia, verifica che le regole di pricing continuino a funzionare — non c'è modo di vederlo dall'interfaccia, ma è verificato nei test), disattivarne una, e prova a cancellare una finitura che hai usato in una richiesta di prova: il sistema te lo impedisce con un messaggio chiaro.

### Nota di trasparenza sulla verifica in questo ambiente di sviluppo

Verificato con 6 casi reali contro PostgreSQL: generazione slug corretta, gestione di nomi duplicati (suffisso automatico), **slug che resta stabile anche quando il nome commerciale cambia** (il caso più delicato, dato che è la garanzia su cui si regge tutto l'Incremento 1), cancellazione permessa per una finitura mai usata, cancellazione bloccata con messaggio corretto per una finitura già scelta in una richiesta reale, e disattivazione sempre permessa indipendentemente dall'uso. Poi verificato via HTTP reale: login, pagina indice con conteggi corretti, pagina Finiture con i dati del seed, protezione della rotta senza sessione (redirect).

**Un bug reale trovato e corretto, non nell'adattatore di sviluppo questa volta ma nel codice applicativo stesso**: il componente client `FormFinitura.tsx` importava una costante da `catalogo-service.ts`, un modulo server-only che carica il driver Postgres (`pg`) — la build falliva perché webpack provava a impacchettare `pg` (che dipende da moduli Node come `fs`/`dns`/`net`) nel bundle del browser. Non basta che un componente client usi solo una piccola parte "innocua" di un modulo server: l'intero modulo viene comunque valutato al caricamento. Corretto estraendo la costante in un file dedicato, senza alcuna dipendenza server, importabile in sicurezza da entrambi i lati.

## Stato del progetto (versioni precedenti)

**Catalogo Tecnico — Incremento 1: Finiture come catalogo condiviso, completato e verificato.**

Primo incremento concreto di ADR-0006 (repository ArtigianOS). Le 4 opzioni statiche di "materiale" (duplicate nel JSON di ogni Tipo di Progetto) sono sostituite da un vero catalogo `Finitura` condiviso — 11 finiture reali su 5 categorie (Legno, Laccato, Laminato, Pietra/Marmo, Metallo), amministrabile senza intervento di sviluppo (il pannello arriva nell'Incremento 2).

- **Presentazione arricchita nel wizard**: ricerca live, raggruppamento per categoria, campioni visivi generati via CSS (colore + pattern per legno/pietra/metallo/tessuto/liscio) — **zero fotografie caricate**, coerente con lo storage documenti deliberatamente in pausa. Nessun onere per il titolare al primo giorno (Time to First Value).
- **Nessuna rottura delle regole di pricing esistenti**: ogni Finitura porta uno slug tecnico stabile (`rovere`, `laccato_opaco`, `laminato`, `pietra` — invariati), esposto al Rule Engine esattamente come prima. Verificato con gli stessi identici casi dell'Incremento 7: risultati bit-per-bit invariati.
- **Progressive Disclosure**: il selettore arricchito compare solo quando le opzioni portano un campione visivo (`coloreHex`) — un campo `select_immagine` senza quei dati continua a usare la resa precedente, invariata.

### Come provare la demo

```bash
npm install
cp .env.example .env
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Apri `/progetti/cucina`, arriva allo step "Materiali": vedrai il catalogo raggruppato per categoria con campioni colorati, una casella di ricerca (compare oltre le 8 opzioni), selezione con evidenziazione.

### Nota di trasparenza sulla verifica in questo ambiente di sviluppo

Verificato in tre passaggi: (1) il seed popola correttamente le 11 Finiture con gli slug tecnici attesi; (2) **gli stessi 4 casi di pricing dell'Incremento 7, rieseguiti identici, producono risultati bit-per-bit invarianti** — il rischio esplicitamente segnalato nel piano di implementazione (cambiare la forma del catalogo senza rompere silenziosamente le regole esistenti) è chiuso, non solo dichiarato; un quinto caso con una finitura nuova (`noce_canaletto`, non presente nelle condizioni originali) ricade correttamente sul fallback generico, senza errori; (3) la configurazione risolta lato server per il wizard contiene davvero i campi (`categoria`, `coloreHex`, `texture`) attesi dal componente di rendering, confermato leggendo l'output reale di `risolviConfigurazioneDinamica` — non potendo verificare visivamente il rendering client in questo ambiente (nessun browser reale disponibile), la build di produzione pulita e la forma dei dati risolti sono la prova più diretta disponibile che il componente riceverà esattamente ciò che si aspetta.

Due bug reali trovati e corretti durante la verifica, entrambi nell'adattatore di sviluppo locale (mai nel codice applicativo reale): `updatedAt` non veniva generato automaticamente per la nuova tabella `finitura` (mancava nell'elenco `TABELLE_CON_UPDATED_AT`); il costruttore `PrismaClient` dell'adattatore non accettava l'argomento `{ adapter }` richiesto da Prisma 7 (la vostra correzione, mai risincronizzata in questo ambiente fino ad ora) e la sintassi di chiave composta `tenantId_chiave` non veniva interpretata a runtime dal motore di query dell'adattatore.

## Stato del progetto (versioni precedenti)

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

Prerequisiti: Node.js 20+, PostgreSQL 16 (o Docker, v. sezione successiva — più semplice se non si vuole configurare Postgres a mano).

Se PostgreSQL è già installato ma non ha ancora un ruolo/database per questo progetto, crearli prima (`.env.example` assume queste credenziali esatte — cambiarle è possibile, ma allora va aggiornato anche `DATABASE_URL`/`DIRECT_URL` di conseguenza):

```bash
psql -U postgres -c "CREATE ROLE ramirez WITH LOGIN PASSWORD 'ramirez_dev_password' CREATEDB;"
psql -U postgres -c "CREATE DATABASE ramirez_atelier OWNER ramirez;"
```

```bash
npm install
cp .env.example .env   # e aggiorna DATABASE_URL/DIRECT_URL se hai usato credenziali diverse sopra

npx prisma migrate deploy   # applica le migrazioni già scritte (non "migrate dev": qui non si crea una nuova migrazione, si applicano quelle esistenti)
npx prisma db seed          # popola i tipi di progetto (Cucina, Armadio), il Catalogo Tecnico e l'utente amministratore

npm run dev
# http://localhost:3000
```

**Nota operativa se si applicano le migrazioni manualmente** (es. via `psql -f` invece del CLI Prisma, per qualunque motivo): usare sempre lo stesso ruolo configurato in `DATABASE_URL`/`DIRECT_URL`, non un superuser — altrimenti le tabelle risultano possedute da un ruolo diverso da quello con cui l'app si connette, e ogni query fallisce con "permission denied" anche se le tabelle esistono e sono corrette.

## Avvio con Docker

```bash
cp .env.example .env
docker compose up -d postgres minio   # solo i servizi di supporto, non l'app - serve prima popolare il database

npx prisma migrate deploy   # dall'host: DATABASE_URL/DIRECT_URL in .env puntano già a localhost:5432, esposto dal container
npx prisma db seed

docker compose up --build app   # ora l'app, con il database già pronto
# App:   http://localhost:3000
# MinIO: http://localhost:9001 (console)
```

**Perché non semplicemente `docker compose up --build`:** il container dell'app esegue solo `node server.js` — non applica migrazioni né seed da solo. Avviarlo prima di popolare il database produce un'app che risponde ma fallisce a ogni pagina, perché nessuna tabella esiste ancora.

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
