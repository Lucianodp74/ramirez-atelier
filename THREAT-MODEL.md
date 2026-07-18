# Threat Model — Identity & Security (Incremento 5)

**Ambito:** il Bounded Context Identity & Security implementato in Ramirez Atelier (ADR-0004 v1.1), inclusa la sua integrazione con l'area amministrativa `/admin` e le API `/api/richieste/*`. Non copre (ancora) `IdentitaEsterna`/portale clienti, non implementato in questo incremento.

---

## 1. Asset da proteggere

| Asset                                                                          | Perché conta                                                                                                          |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Credenziali (password) degli Utenti                                            | Compromissione = accesso completo all'account e a tutte le sue Membership                                             |
| Sessioni attive                                                                | Un token di sessione rubato equivale a un login riuscito, senza bisogno della password                                |
| Dati di business per Tenant (richieste clienti, note interne, fasce di prezzo) | Riservatezza commerciale; dati personali dei clienti finali (GDPR)                                                    |
| Confini tra Tenant                                                             | Il valore stesso della piattaforma multi-tenant dipende dalla garanzia che un'azienda non veda mai i dati di un'altra |
| Regole di business (Rule Engine) e la loro cronologia di esecuzione            | Integrità delle decisioni automatizzate (es. priorità commerciale)                                                    |
| Registro di audit (`evento_sicurezza`)                                         | Prova, in caso di incidente, di chi ha fatto cosa e quando                                                            |

## 2. Attori

| Attore                                                      | Fiducia               | Note                                                                          |
| ----------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------- |
| Utente legittimo (Proprietario/Dipendente)                  | Alta, ma non assoluta | Può comunque avere credenziali compromesse o compiere errori                  |
| Aggressore esterno anonimo                                  | Nessuna               | Tenta login, sfrutta vulnerabilità note, intercetta traffico                  |
| Utente di un altro Tenant (in un futuro multi-tenant reale) | Media                 | Legittimo sulla piattaforma, ma non deve avere alcun accesso al Tenant altrui |
| Un Utente con Membership legittima ma permessi limitati     | Media                 | Potrebbe tentare di superare i propri permessi (escalation)                   |
| Sviluppatore/operatore con accesso al database              | Alta ma da limitare   | Un dump del DB non deve bastare a impersonare nessuno (§4)                    |

## 3. Superfici di attacco

1. **`/api/auth/login`** — endpoint pubblico, esposto a tentativi di forza bruta e a enumerazione di indirizzi email.
2. **Cookie di sessione** (`ra_sessione_admin`) — se intercettato (rete non cifrata, XSS), consente accesso senza password.
3. **API `/api/richieste/*`** e Server Action in `/admin` — ogni endpoint che legge/scrive dati di business è una superficie potenziale di accesso non autorizzato o di escalation di privilegi se il controllo permessi viene dimenticato in un singolo punto.
4. **Parametri lato client** (es. un `tenantId` o `id` passato nell'URL/body) — rischio di manipolazione per tentare accesso cross-tenant o a risorse altrui.
5. **Database stesso** — un accesso diretto (dump, backup non protetto) espone password/token se non correttamente hashati.
6. **Link di recupero password / inviti** — se prevedibili o non scadenti, consentono account takeover.

## 4. Minacce principali e contromisure implementate

### 4.1 Accesso non autorizzato (credential stuffing, brute force)

**Contromisura:** password Argon2id (costoso da forzare offline); messaggio d'errore identico per email inesistente e password errata (nessuna enumerazione, verificato nel Test 3 dell'Incremento 5); ogni tentativo — riuscito o fallito — registrato in `evento_sicurezza` con motivo. **Rate limiting implementato nell'Incremento 6**: 5 tentativi falliti in 15 minuti bloccano ulteriori tentativi per quello specifico Utente, verificato concretamente (un sesto tentativo con la password _corretta_ viene comunque respinto finché la finestra non scade).
**Rischio residuo:** il limite è per Utente (via `evento_sicurezza.utenteId`), non ancora per indirizzo IP o email inesistente — un attacco distribuito su molte email inventate non è rate-limited (nessun account reale a rischio in quel caso, ma un possibile carico applicativo). Da rivalutare con dati di traffico reali.

### 4.2 Escalation di privilegi

**Contromisura:** `VerificatorePermesso` come unico punto di decisione, invocato esplicitamente in ogni Server Action e ogni Route Handler prima di qualunque operazione di business (verificato: Test 6, e verificato via HTTP con richiesta priva di sessione → 401 sistematico). Nessuna condizione hard-coded sul nome del ruolo: un permesso non assegnato è semplicemente assente dal database.
**Rischio residuo:** l'implementazione attuale copre i moduli `richieste`, `fasce_budget`, `regole`. Ogni nuovo modulo futuro deve ricordarsi di applicare lo stesso pattern — non è imposto strutturalmente da un middleware globale unico, ma dalla disciplina di chiamare `richiediContesto` a inizio di ogni funzione. Ho verificato che sia stato fatto ovunque in questo incremento; resta un rischio di processo (disciplina del team), non solo tecnico, da mitigare in futuro con test automatici che verifichino la presenza del controllo su ogni endpoint.

### 4.3 Cross-tenant access

**Contromisura:** ogni funzione di servizio richiede `tenantId` come primo parametro esplicito, mai opzionale; `dettaglioRichiesta`/`cambiaStato`/`aggiungiCommento` verificano che l'entità richiesta appartenga davvero al Tenant del chiamante, restituendo "non trovata" (mai un errore diverso che ne riveli l'esistenza) in caso contrario. **Verificato concretamente** (Test 7): creata una richiesta in un Tenant concorrente, confermato che il Tenant Ramirez Atelier non possa vederla né nel dettaglio né nell'elenco.
**Rischio residuo:** l'isolamento oggi è applicativo (ogni query filtra esplicitamente per `tenantId`), non ancora garantito a livello di database con Row-Level Security. Un bug futuro in una singola query che dimenticasse il filtro sarebbe uno sfondamento silenzioso. **Rischio rimandato consapevolmente** — RLS è la difesa strutturale prevista per ArtigianOS (Database Design v1.0 §2.2) quando la piattaforma ospiterà davvero più aziende contemporaneamente; per Ramirez Atelier oggi (un solo Tenant reale in produzione) il rischio pratico è basso, ma il codice è già scritto con la disciplina che renderà l'adozione di RLS un'aggiunta, non una riscrittura.

### 4.4 Session hijacking

**Contromisura:** token di sessione opaco, mai un JWT auto-contenuto — solo l'hash è salvato nel database (un dump non basta a impersonare una sessione, §4.6); cookie httpOnly (inaccessibile a JavaScript, mitiga XSS), Secure in produzione (mai in chiaro su rete non cifrata), SameSite=Lax (mitiga CSRF cross-site). **Verificato concretamente** (Test 12 e verifica HTTP): il logout revoca la sessione lato server, e il medesimo cookie non funziona più subito dopo, anche se non fosse stato cancellato lato client.
**Rischio residuo:** nessuna rotazione automatica del token a metà vita della sessione (solo su logout esplicito o revoca amministrativa). Da valutare se la durata di 7 giorni è troppo lunga per il livello di rischio reale una volta in produzione pubblica.

### 4.5 Furto di dati in caso di compromissione del database

**Contromisura:** password mai in chiaro (Argon2id); token di sessione, invito e recupero password mai in chiaro (solo hash SHA-256) — un dump completo del database non permette di autenticarsi come nessuno, solo di sapere che account/sessioni esistono.
**Rischio residuo:** dati di business (nomi clienti, contenuto delle richieste) non sono cifrati at-rest in questo incremento — cifratura del disco/volume è responsabilità dell'infrastruttura di hosting, non ancora configurata/documentata qui.

### 4.6 Furto di identità tramite Membership revocata ma sessione non aggiornata

**Contromisura:** la revoca di una Membership invalida esplicitamente e immediatamente tutte le sessioni che la usano come Tenant attivo (non basta cambiare lo stato della relazione — le sessioni già emesse andrebbero altrimenti verificate una per una a ogni richiesta contro lo stato della Membership, il che di fatto è quello che avviene: `recuperaSessioneCorrente` verifica sempre lo stato ATTIVA della Membership referenziata, non si fida di un valore cacheato). **Verificato concretamente** (Test 11).

### 4.7 Recupero password come vettore di attacco

**Contromisura:** token opaco a scadenza breve (30 minuti), monouso, ogni nuova richiesta invalida le precedenti non ancora usate; risposta dell'endpoint sempre identica indipendentemente dal fatto che l'email esista.
**Rischio residuo esplicito:** l'invio effettivo del link via email non è ancora integrato in questo incremento (nessun servizio email configurato) — il token è generato e persistito correttamente, ma il canale di consegna resta da collegare prima che questa funzionalità sia realmente utilizzabile in produzione.

## 5. Rischi esplicitamente rimandati (non affrontati in questo incremento)

- ~~Rate limiting / blocco account dopo tentativi falliti ripetuti~~ — **implementato nell'Incremento 6** (v. §4.1).
- **Row-Level Security PostgreSQL** per l'isolamento tra Tenant a livello di database, oltre alla disciplina applicativa attuale (§4.3).
- **Rotazione periodica del token di sessione** durante una sessione lunga.
- **Cifratura at-rest** dei dati di business (demandata all'infrastruttura di hosting).
- **Invio reale delle email** (recupero password, inviti) — il meccanismo è pronto, il canale di consegna no.
- **MFA, SSO/OAuth, API Key, Service Account** — deliberatamente rimandati fin dall'ADR-0004 §12, con i rispettivi punti di estensione già identificati.
- **Test automatici di sicurezza** (in questo incremento la verifica è stata manuale/scriptata una tantum, non integrata in una suite di test eseguita ad ogni modifica futura) — da introdurre prima che il codice cresca ulteriormente, per evitare regressioni silenziose su un contesto così sensibile.

## 6. Conclusione

La sicurezza qui non è stata trattata come una conseguenza del codice scritto per altri scopi: le decisioni chiave (hashing, sessioni revocabili, isolamento tenant, autorizzazione centralizzata) erano già nell'ADR-0004 prima di scrivere una riga di implementazione, e sono state verificate una per una con casi concreti (non solo test unitari) prima di considerare l'incremento concluso. I rischi rimandati sono elencati esplicitamente, non nascosti: il criterio usato per rimandarli è stato "il costo di aggiungerlo dopo è accettabile" (es. RLS, rate limiting) mai "speriamo non serva".
