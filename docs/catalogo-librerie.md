# Catalogo Librerie — V1

Collezione di librerie già progettate, organizzata in cinque linee. Un modello di catalogo è
un **punto di partenza** per una richiesta di preventivo: non ha un prezzo proprio e non crea
mai una commessa.

## Cosa c'è

| Parte                         | Dove                                                       |
| ----------------------------- | ---------------------------------------------------------- |
| Famiglie e modelli            | `src/lib/catalogo-librerie/catalogo.ts`                    |
| Struttura di composizione     | `src/lib/catalogo-librerie/composizione.ts`                |
| Pagina pubblica della sezione | `/librerie` (`src/app/librerie/page.tsx`)                  |
| Scheda del modello            | `/librerie/[codice]`                                       |
| Elenco per l'area operativa   | `/admin/catalogo/librerie` (permesso `catalogo` / `leggi`) |
| Avvio della richiesta         | `/preventivatore?modello=<codice>`                         |
| Test                          | `tests/catalogo-librerie.test.ts`                          |

Le cinque linee (Essenziale, Geometrica, Atelier, Parete, Modulare) sono famiglie progettuali
iniziali. I cinque modelli presenti, uno per linea, sono **esempi dimostrativi in stato
`BOZZA`**: misure e composizioni sono ipotesi di lavoro, non prodotti approvati.

## Stati

| Stato             | Pagina pubblica                         | Richiesta di preventivo |
| ----------------- | --------------------------------------- | ----------------------- |
| `BOZZA`           | Non esiste (404), nemmeno per URL       | No                      |
| `APPROVATO`       | Visibile                                | Sì                      |
| `NON_DISPONIBILE` | Visibile, segnalato come non ordinabile | No                      |

Un utente autenticato nell'area operativa con permesso di lettura sul catalogo vede anche le
bozze (**anteprima interna**, segnalata da una fascia in alto) e può provarne il flusso fino al
Preventivatore. Un esempio dimostrativo non può essere approvato: `validaCatalogo` lo segnala
come errore e il test fallisce.

Con il catalogo consegnato **nessun modello è visibile al pubblico**: la pagina `/librerie`
mostra le cinque linee con la dicitura "Modelli in definizione" e il rimando al Preventivatore.

## Flusso di richiesta

`RICHIESTA → PREVENTIVO → BOM → COMMESSA → PRODUZIONE → CONSEGNA → KPI` resta invariato.

1. Dalla scheda, "Richiedi preventivo" apre `/preventivatore?modello=<codice>`.
2. Il server risolve il codice e traduce la composizione in `ModuloConfigurato[]`, lo stesso
   formato dei Progetti Preimpostati. Il cliente può modificare tutto.
3. Stima, salvataggio della richiesta e BOM iniziale sono quelli già esistenti
   (`calcolaStimaPreventivatore`, `salvaRichiestaPreventivatore`): nessun secondo motore prezzi.

### Modello d'origine

La richiesta salva il modello di partenza in
`datiEstensione.preventivatoreModulare.modelloOrigine`: codice, nome e famiglia copiati al
momento della richiesta, più `personalizzato` (vero se il cliente ha cambiato la configurazione
proposta). Il modello dice da dove si è partiti; `moduli`, accanto, dice che cosa è stato chiesto.

- Il codice arriva dal browser e viene convalidato dal server al salvataggio: un codice non
  valido, o di un modello che non poteva avviare una richiesta, viene ignorato e la richiesta si
  salva comunque.
- È un dato descrittivo: non entra nella stima, nella BOM né nel flusso verso la commessa, e non
  richiede migrazioni.
- È visibile solo nell'area operativa, nella scheda "Modello di partenza" del dettaglio richiesta.
- Le richieste precedenti non hanno il campo e non mostrano la scheda.

## Immagini

Nessuna fotografia: la scheda mostra un prospetto schematico disegnato dalla composizione, con
la dicitura che non si tratta di un lavoro realizzato. Il campo `immagini` distingue `APPROVATA`
da `DIMOSTRATIVA`; solo le prime possono essere presentate come lavori reali.

## Struttura per la composizione modulare

Una libreria è una sequenza di **colonne** (moduli verticali), ognuna fatta di **vani** impilati
dal basso:

| Vano          | Contiene            | Modulo del Preventivatore     |
| ------------- | ------------------- | ----------------------------- |
| `VANO_APERTO` | ripiani             | `LIBRERIA` / `APERTO`         |
| `BASE_ANTE`   | 1 o 2 ante, ripiani | `BASE` / `1_PORTA`, `2_PORTE` |
| `CASSETTI`    | 3 o 4 cassetti      | `CASSETTIERA`                 |

A livello di composizione: profondità, schienale, materiale e finitura. Limiti dimensionali,
materiali e finiture ammessi sono quelli di `CATALOGO_MODULI` del Preventivatore; la validazione
riusa `validaModulo` e aggiunge solo la coerenza della struttura.

## Decisioni che spettano a Ramirez Atelier

Nulla di quanto segue è stato deciso nel codice:

- quali modelli entrano davvero in collezione, con quali nomi, misure standard e descrizioni;
- se la traduzione "un vano = un modulo" rappresenta correttamente il costo di una libreria
  (oggi una colonna con base chiusa e vano aperto viene stimata come due moduli distinti);
- fianchi condivisi tra colonne affiancate, spessori, portata e passo dei ripiani;
- regole di compatibilità tra moduli (altezze allineate, profondità miste, giunzioni);
- essenze e finiture reali: la scheda mostra solo le voci generiche del Preventivatore
  (truciolare/MDF/multistrato, melaminico/laminato/laccato);
- fotografie approvate dei lavori.

## Cosa manca

1. **Gestione amministrativa dei modelli.** Stato e dati si cambiano nel codice con una Pull
   Request. Portarli in una tabella richiede una migrazione; oggi `vercel-build` esegue
   `prisma migrate deploy` a ogni build, anteprime comprese, quindi va prima verificato a quale
   database punta l'ambiente Preview di Vercel.
2. **Modello d'origine fuori dal dettaglio richiesta.** Non compare nell'elenco richieste, nel
   PDF del preventivo né nei KPI.
3. **Collegamento dalla home page.** La sezione è raggiungibile da `/progetti` e dall'area
   operativa.
4. **Editor di composizione.** La struttura è pronta, l'interfaccia per comporre colonne e vani
   no; nessun configuratore 3D.
