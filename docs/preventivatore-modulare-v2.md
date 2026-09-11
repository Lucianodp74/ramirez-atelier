# Preventivatore Modulare V2 — audit e architettura

## Obiettivo

Trasformare il configuratore attuale da raccolta di informazioni per richiesta progetto a un preventivatore parametrico: il cliente compone moduli standard, modifica le dimensioni, sceglie materiale e finitura e riceve una stima; il titolare vede invece costo, distinta, lavorazioni, margine e prezzo di vendita.

La Home resta fuori scope.

## Stato rilevato al 2026-09-10

La base applicativa esistente è già adatta a una prima evoluzione senza introdurre un secondo stack:

- `TipoProgetto.configurazione` definisce dinamicamente step e campi del wizard;
- `RichiestaProgetto.datiFormJson` conserva le risposte del cliente;
- `Finitura`, `Ferramenta` e `Accessorio` sono già cataloghi amministrabili;
- esiste un `listino_prezzo` con tipi `MATERIALE`, `COMPONENTE`, `COMPOSIZIONE`, prezzo, unità, materiale e dimensioni;
- esiste storico dei prezzi del listino;
- esiste `listino_composizione_riga`, con quantità e costo unitario salvato come snapshot;
- esiste una BOM operativa e un servizio di riepilogo costi;
- esiste già un calcolo prezzo BOM per costo produzione, lavorazioni, manodopera, spese, ricarico, sconto e IVA;
- esiste un catalogo benchmark separato, esplicitamente distinto dai costi reali;
- esiste un Rule Engine generico utilizzabile per regole di pricing;
- esistono già PDF preventivo e workflow della richiesta.

## Decisione architetturale

Non forkare un nuovo configuratore e non sostituire l'architettura Ramirez. Usare il repository `ramirez-atelier` come sistema principale e prendere da progetti open source solo idee o componenti tecnici realmente compatibili, previa verifica della licenza.

Riferimenti studiati:

1. WoodworkingShop — riferimento principale per mobili parametrici, parti, composizioni e logica da falegnameria.
2. DeskFlow Studio — riferimento principale per catalogo/configurazione/pricing e validazione server-side.
3. Cabinet Studio — riferimento per geometria parametrica e scomposizione del mobile in pannelli/componenti.
4. Open Configurator — riferimento per separare regole, configurazione e motore di prezzo.
5. O-LAP — riferimento esplorativo per il futuro modello di mobili parametrici.

## Modello funzionale V2

### Modulo

Un modulo è un mobile parametrico con:

- codice stabile;
- categoria (`BASE`, `PENSILE`, `COLONNA`, `LIBRERIA`, ecc.);
- dimensioni min/max e dimensioni iniziali;
- materiale ammesso;
- finiture ammesse;
- componenti/parti generabili;
- regole di compatibilità;
- formula o composizione di costo;
- eventuali opzioni (ante, cassetti, ripiani, schiena, ferramenta).

### Composizione

Una composizione è un insieme ordinato di moduli. Ogni riga mantiene:

- modulo scelto;
- quantità;
- dimensioni effettive;
- opzioni;
- materiale;
- finitura;
- snapshot del prezzo/costo quando la composizione viene congelata.

Esempio:

`BASE 60 + BASE 90 + CASSETTIERA 60 + PENSILE 90 x2`

### Distinta

La configurazione deve poter generare una distinta tecnica. Per la V2 iniziale la distinta può essere composta da pannelli/componenti catalogati; in una fase successiva si aggiungeranno ottimizzazione del taglio, sfrido e nesting.

## Pricing V2

Il motore deve distinguere sempre:

`COSTO INTERNO` → `PREZZO DI VENDITA`

Il costo interno è composto, secondo configurazione, da:

- pannelli/materiali;
- bordatura;
- schiene;
- ferramenta;
- ante e cassetti;
- finitura;
- lavorazioni;
- manodopera;
- trasporto/montaggio;
- quota costi indiretti quando configurata.

Il prezzo cliente applica poi il criterio commerciale Ramirez (ricarico/margine configurato) e, solo nel documento fiscale quando previsto, l'IVA.

Non inserire nel codice prezzi definitivi Ramirez. I benchmark sono solo riferimenti di calibrazione.

## Prima famiglia di moduli

V1 del motore modulare:

1. Base cucina
2. Pensile
3. Colonna
4. Cassettiera
5. Modulo libreria/contenitore

Per ciascuno prevedere dimensioni parametrizzabili entro limiti tecnici, non soltanto misure fisse.

## Prima matrice materiali

Materiali strutturali iniziali:

- Truciolare
- MDF
- Multistrato

Finiture iniziali:

- Melaminico
- Laminato
- Laccato
- Impiallacciato (preparato come estensione, non obbligatorio nella prima UI)

La distinzione è intenzionale: `materiale` descrive il supporto/costruzione; `finitura` descrive la superficie finale. Non trattare la finitura come sinonimo del materiale.

## UX cliente

Ridurre il wizard a poche decisioni progressive:

1. scegli il modulo;
2. inserisci/modifica larghezza, altezza e profondità;
3. scegli materiale;
4. scegli finitura;
5. scegli configurazione (ante/cassetti/ripiani);
6. aggiungi/duplica altri moduli;
7. riepilogo con stima.

Il prezzo deve aggiornarsi senza mostrare costi interni. Per la prima versione è preferibile una fascia (`€ X – Y`) o una stima con dicitura esplicita, non un prezzo definitivo mascherato da precisione.

## UX titolare

Area amministrativa separata con:

- moduli;
- componenti e materiali;
- finiture;
- ferramenta;
- formule/regole prezzo;
- costi di lavorazione e manodopera;
- margine/ricarico;
- storico;
- test del calcolo su una configurazione esempio.

## Regole di integrità

- Il prezzo deve essere ricalcolato server-side.
- Il browser non è fonte autorevole del prezzo.
- I prezzi storici usati in una BOM/preventivo congelato non devono cambiare quando il listino viene aggiornato.
- Una voce disattivata non deve essere proposta per nuove configurazioni ma deve restare leggibile nello storico.
- Un modulo non deve accettare dimensioni fuori dai limiti del catalogo.
- Le incompatibilità tra materiale, finitura, ferramenta e modulo devono essere espresse come dati/regole, non sparse in `if` nell'interfaccia.

## Prezzi: metodo di caricamento

Per la fase iniziale usare tre livelli distinti:

1. **Benchmark di mercato** — già presente nel progetto, con fonte e data di rilevazione.
2. **Costo tecnico Ramirez** — prezzo effettivamente sostenuto o concordato con il fornitore.
3. **Prezzo di vendita Ramirez** — ottenuto dal motore applicando lavorazioni e politica commerciale.

I valori benchmark non devono diventare automaticamente costi di produzione.

## Collegamento al Listino amministrativo

Il servizio `src/server/services/preventivatore-listino-service.ts` collega il motore al `listino_prezzo` esistente senza creare un secondo catalogo. I prezzi restano nel database e vengono risolti per `tenantId` usando codici tecnici stabili.

Codici richiesti dal motore:

- `MAT-TRUCIOLARE`, `MAT-MDF`, `MAT-MULTISTRATO` — M2
- `FIN-MELAMINICO`, `FIN-LAMINATO`, `FIN-LACCATO` — M2
- `SERV-BORDO-ML` — ML
- `MAT-RETRO-M2` — M2
- `FER-PORTA`, `FER-CASSETTO` — PZ
- `MAN-ORE-BASE` — H
- `MAN-ORE-M2` — H/M2
- `MAN-ORE-PORTA`, `MAN-ORE-CASSETTO`, `MAN-ORE-RIPIANO` — H/PZ
- `MAN-COSTO-ORA` — EUR/H
- `COMM-RICARICO` — %

Se una tariffa obbligatoria manca, è inattiva o usa un'unità diversa da quella prevista, il servizio interrompe il calcolo con un errore esplicito. Non vengono inventati prezzi.

Il Listino conserva inoltre il proprio storico delle variazioni; l'integrazione futura con BOM/preventivo continuerà a congelare i costi quando la distinta viene confermata.

## Cosa non fare nella V2 iniziale

- non introdurre subito CAD/CAM completo;
- non modificare il GLB STELLA per ottenere il preventivatore;
- non introdurre subito nesting/ottimizzazione pannelli industriale;
- non fare AI pricing;
- non creare un secondo database/catalogo;
- non duplicare `Finitura`, `Ferramenta`, `Accessorio` o la BOM già presenti;
- non modificare la Home.

## Sequenza di implementazione

### Incremento A — dominio modulare

Definire il modello dati minimo per moduli, parti e configurazioni senza rompere listino/BOM esistenti.

### Incremento B — motore di calcolo

Implementare un motore puro e testabile che riceva una configurazione validata e produca:

- distinta;
- costo materiali;
- costi accessori;
- lavorazioni;
- costo produzione;
- prezzo di vendita;
- dettaglio delle regole applicate.

### Incremento C — catalogo amministrativo

Permettere al titolare di creare/modificare/disattivare moduli, prezzi e regole senza modificare codice. Il collegamento tecnico al Listino è ora predisposto; resta la UI dedicata per rendere le tariffe leggibili e gestibili in modo più semplice.

### Incremento D — nuova UI cliente

Sostituire progressivamente i passaggi generici del wizard con il percorso modulare per i primi moduli.

### Incremento E — preventivo

Collegare configurazione congelata, BOM e PDF preventivo mantenendo gli snapshot dei prezzi.

## Criterio di successo V2

Una configurazione come:

`2 x BASE + 1 x CASSETTIERA + 2 x PENSILE`

con dimensioni, truciolare/multistrato e melaminico/laminato/laccato deve produrre lo stesso risultato economico indipendentemente dalla UI utilizzata, deve essere verificabile con test automatici e deve lasciare al titolare la possibilità di cambiare il listino senza modificare il codice.
