# Integrazione del listino nel Preventivatore — audit e piano

**Stato:** audit preliminare, nessuna modifica al motore prezzi  
**Riferimento:** PR #116 e issue #117  
**Obiettivo:** rendere aggiornabili i costi senza alterare i preventivi già esistenti né trasformare una stima strutturale in una certificazione produttiva.

## 1. Evidenze dal codice esaminato

### Motore modulare

File: `src/lib/preventivatore/prezzo-modulare.ts`

- `calcolaCostoModulo(modulo, tariffe)` calcola costi e prezzo indicativo da un oggetto `TariffePreventivatore`.
- Se non viene passata una tariffa, il default è `TARIFFE_DEMO`.
- Il codice dichiara espressamente `TARIFFE_DEMO` come valori dimostrativi, non prezzi Ramirez.
- Le tariffe sono aggregate per superficie, metro lineare, pezzo e ore; non sono un listino completo di codici fornitore.
- Il calcolo genera una distinta teorica parametrica. Le note del codice indicano che bordi a vista, giochi, battute e ripartizioni miste devono ancora essere definiti in fase esecutiva.

File: `src/lib/preventivatore/tariffe.ts`

- Esiste un catalogo tipizzato di codici tariffa, ad esempio `MAT-TRUCIOLARE`, `FIN-LAMINATO`, `SERV-BORDO-ML`, `MAT-RETRO-M2`, `FER-PORTA`, `MAN-COSTO-ORA` e `COMM-RICARICO`.
- Queste tariffe rappresentano valori di calcolo e regole di lavoro, non identificano necessariamente un articolo commerciale acquistabile.

File: `src/lib/preventivatore/bom-iniziale.ts`

- La BOM ripartisce gli importi già calcolati dal motore e controlla che il totale coincida al centesimo con il costo di produzione.
- La BOM non rilegge il listino e non dovrebbe diventare un secondo motore prezzi.
- Cambiare le tariffe può modificare il costo di produzione salvato nelle nuove BOM; l'effetto va testato prima del rilascio.

Test: `tests/bom-iniziale.test.ts`

- Il test definisce un oggetto `LISTINO` esplicito, distinto da `TARIFFE_DEMO`, con valori e regole specifici (incluso un sistema scorrevole da 700 € e un ricarico del 40%).
- Questi valori nei test sono fixture di test, non prova sufficiente che gli stessi siano i valori correnti in produzione.
- I test vincolano l'uguaglianza tra costo motore e totale BOM, che deve restare invariata.

### Catalogo pareti

File: `src/lib/catalogo-librerie/composizione.ts`

- La composizione viene tradotta in un modulo del Preventivatore per ogni vano.
- Le colonne affiancate sono attualmente convertite separatamente: non esiste ancora un calcolo validato dei fianchi condivisi.
- La validazione attuale controlla la struttura e i limiti del catalogo moduli; non approva portate, giunzioni, ancoraggi o fattibilità costruttiva.

### File CSV del listino

I file `listino-operativo-pareti-attrezzate.csv` e `storico-prezzi-pareti-attrezzate.csv` sono strumenti di raccolta manuale. **Non sono letti dall'applicazione** e non influenzano preventivi, BOM o ordini.

## 2. Perché non collegare direttamente il CSV al prezzo

Il CSV descrive articoli acquistabili (marca, codice fornitore, confezione, unità e prezzo); il motore si aspetta tariffe normalizzate (€/m², €/ml, €/pezzo, ore e ricarico). Serve una trasformazione esplicita, per esempio:

1. articolo acquistato con codice fornitore e confezione;
2. conversione dell'unità di acquisto in unità di calcolo;
3. eventuali costi separati di trasporto, lavorazione e sfrido;
4. tariffa normalizzata approvata, con fonte e data;
5. regola che mappa la tariffa al calcolo e, separatamente, alla BOM.

Senza questa mappatura si rischia di sommare due volte materiali e finiture, confondere prezzi netti e IVA, o trattare un prezzo retail come prezzo d'acquisto confermato.

## 3. Piano tecnico consigliato

### Fase A — audit del percorso tariffa (prima di qualsiasi migrazione)

- Tracciare la lettura delle tariffe persistenti e il fallback verso `TARIFFE_DEMO`.
- Individuare le tabelle e le migrazioni già presenti per il listino e verificare quali valori sono letti dal server, senza collegarsi al database di produzione.
- Verificare dove vengono creati i preventivi e le BOM e quali tariffe vengono salvate con la richiesta.
- Aggiungere test per distinguere tariffa assente, tariffa incompleta e tariffa approvata.
- Non stampare né esportare credenziali o dati di produzione.

**Gate:** non procedere a una migrazione finché non è chiaro se esiste già una fonte tariffaria amministrabile e come vengono versionati i prezzi.

### Fase B — modello dati minimo, se l'audit conferma che manca

Separare logicamente:

- **Articolo fornitore:** codice interno, fornitore, codice articolo, descrizione, unità d'acquisto, quantità per confezione, stato.
- **Rilevazione prezzo:** prezzo, valuta, IVA, trasporto, fonte, data e validità; append-only per conservare lo storico.
- **Tariffa di calcolo approvata:** codice motore, unità normalizzata, valore netto, regola di conversione, sfrido approvato, fonte e revisore.
- **Versione listino:** identificativo stabile e data di validità, per sapere quale tariffa è stata usata in ogni preventivo.

I valori di esempio non devono essere attivati automaticamente. Le tariffe dimostrative devono essere chiaramente marcate e non devono essere usate come prezzi ufficiali.

### Fase C — aggiornamento amministrativo

- Route protetta con permesso specifico di modifica del listino, separato dal solo permesso di lettura del catalogo.
- Validazione server-side di codici, unità, importi e date.
- Storico immutabile delle rilevazioni e audit di chi ha approvato la tariffa.
- Conferma esplicita prima di attivare una nuova versione tariffaria.
- Nessuna cancellazione o sovrascrittura delle rilevazioni precedenti.

### Fase D — integrazione retrocompatibile

- Un unico punto di lettura server-side delle tariffe per il motore esistente.
- Passare al motore una versione immutabile delle tariffe; evitare letture tariffarie diverse tra righe dello stesso preventivo.
- Conservare snapshot/versione delle tariffe applicate alle nuove richieste e BOM, ove compatibile con lo schema attuale.
- Non ricalcolare automaticamente preventivi e BOM già salvati quando il listino cambia.
- Nessun prezzo proveniente dal browser deve essere considerato attendibile.

### Fase E — test e rilascio

- Test unitari delle conversioni unità, IVA, trasporto e sfrido.
- Test che la somma BOM coincida al centesimo con il costo del motore.
- Test per listino mancante, tariffa incompleta, articolo scaduto e nuova versione.
- Test di autorizzazione: sola lettura non può modificare il listino.
- Test di regressione su richieste e preventivi esistenti.
- Migrazione prima solo in ambiente di test/preview autorizzato; nessuna operazione sul database produzione senza approvazione esplicita.
- CI verde, review indipendente e approvazione tecnica prima del merge; deploy produzione solo con autorizzazione separata.

## 4. Gate aperti

- [ ] Tracciato il percorso reale di caricamento tariffe dal database al motore.
- [ ] Confermato se le tabelle tariffarie esistenti possono essere riutilizzate.
- [ ] Approvati i prezzi e le conversioni dal responsabile acquisti.
- [ ] Approvate le regole costruttive e la distinta della parete campione dal responsabile tecnico.
- [ ] Definito il versionamento tariffario e la retrocompatibilità.
- [ ] Review indipendente e test CI sul commit finale.

## 5. Confini

Questo documento è un piano di audit, non un'approvazione di prezzi o di produzione. Non modifica il motore, le tariffe, le migrazioni, la BOM, il database o i preventivi. Non autorizza merge o deploy.
