# Integrazione del listino nel Preventivatore — audit e piano

**Stato:** audit preliminare, nessuna modifica al motore prezzi.  
**Riferimento:** PR #116 e issue #117.

## 1. Evidenze dal codice esaminato

### Motore modulare — `src/lib/preventivatore/prezzo-modulare.ts`

- `calcolaCostoModulo(modulo, tariffe)` calcola costi e prezzo indicativo da un oggetto `TariffePreventivatore`.
- Se non viene passata una tariffa, il default è `TARIFFE_DEMO`, dichiarato esplicitamente come dimostrativo e non rappresentativo dei prezzi Ramirez.
- Il motore usa tariffe normalizzate per m², metro lineare, pezzo e ore; non usa direttamente codici commerciali e confezioni dei fornitori.
- La distinta è parametrica: il codice contiene note su coste a vista, giochi, battute e ripartizioni che devono essere definiti in fase esecutiva.

### Definizioni tariffarie — `src/lib/preventivatore/tariffe.ts`

Esistono codici tipizzati come `MAT-TRUCIOLARE`, `MAT-MDF`, `FIN-LAMINATO`, `SERV-BORDO-ML`, `MAT-RETRO-M2`, `FER-PORTA`, `MAN-COSTO-ORA` e `COMM-RICARICO`. Sono tariffe di calcolo, non necessariamente articoli acquistabili.

### BOM iniziale — `src/lib/preventivatore/bom-iniziale.ts`

La BOM ripartisce importi già calcolati dal motore e verifica che il totale coincida al centesimo con il costo di produzione. Non rilegge il listino e non deve diventare un secondo motore prezzi.

### Test — `tests/bom-iniziale.test.ts`

Il test usa una fixture `LISTINO` esplicita (con valori e regole come sistema scorrevole da 700 € e ricarico 40%). Questi valori nei test non provano da soli quali tariffe siano oggi attive in produzione. È essenziale mantenere l'uguaglianza tra costo motore e totale BOM.

### Catalogo pareti — `src/lib/catalogo-librerie/composizione.ts`

La composizione viene tradotta in un modulo Preventivatore per ogni vano. Le colonne affiancate sono trattate separatamente, quindi il calcolo non riconosce ancora i fianchi condivisi. La validazione strutturale non certifica portate, giunzioni, ancoraggi o fattibilità costruttiva.

### CSV del listino

I CSV aggiunti alla PR sono strumenti di raccolta manuale. Non vengono letti dall'applicazione e non cambiano preventivi, BOM o ordini.

## 2. Perché non collegare direttamente il CSV

Il CSV descrive articoli acquistabili (fornitore, codice, confezione e prezzo); il motore si aspetta tariffe normalizzate. Serve una mappatura esplicita tra articolo, unità di acquisto, conversione, eventuali trasporto/sfrido/lavorazioni e tariffa approvata. Senza questa mappatura si rischia di sommare due volte materiali e finiture, confondere prezzo netto e IVA o usare un prezzo retail come prezzo professionale confermato.

## 3. Piano tecnico

### Fase A — audit del percorso tariffa

- Tracciare la lettura delle tariffe persistenti e il fallback verso `TARIFFE_DEMO`.
- Individuare tabelle e migrazioni già presenti per il listino, senza collegarsi al database di produzione.
- Verificare dove vengono creati preventivi e BOM e quali tariffe vengono salvate con la richiesta.
- Aggiungere test per tariffa assente, incompleta e approvata.

**Gate:** nessuna migrazione finché non è chiaro se esiste già una fonte tariffaria amministrabile e come vengono versionati i prezzi.

### Fase B — modello dati, solo se necessario

Separare logicamente:
- **Articolo fornitore:** codice interno, fornitore, codice articolo, descrizione, unità d'acquisto e quantità per confezione.
- **Rilevazione prezzo:** prezzo, valuta, IVA, trasporto, fonte, data e validità; storico append-only.
- **Tariffa di calcolo approvata:** codice motore, unità normalizzata, valore netto, conversione, sfrido approvato, fonte e revisore.
- **Versione listino:** identificativo e data di validità, per sapere quale tariffa ha alimentato ogni preventivo.

I valori dimostrativi non devono essere attivati automaticamente.

### Fase C — aggiornamento amministrativo

- Route protetta con permesso specifico di modifica listino, distinto dalla sola lettura del catalogo.
- Validazione server-side di codici, unità, importi e date.
- Storico delle rilevazioni e audit di chi approva la tariffa.
- Conferma esplicita prima di attivare una nuova versione; nessuna cancellazione dello storico.

### Fase D — integrazione retrocompatibile

- Un solo punto server-side di lettura tariffe per il motore esistente.
- Passare al motore una versione immutabile delle tariffe, coerente per tutte le righe del preventivo.
- Conservare versione/snapshot delle tariffe applicate alle nuove richieste e BOM, se compatibile con lo schema attuale.
- Non ricalcolare automaticamente preventivi o BOM già salvati quando il listino cambia.
- Non fidarsi mai dei prezzi inviati dal browser.

### Fase E — test e rilascio

- Test di conversione unità, IVA, trasporto e sfrido.
- Test che il totale BOM coincida al centesimo con il costo motore.
- Test di listino mancante, tariffa incompleta, articolo scaduto e nuova versione.
- Test autorizzativi: la sola lettura non può modificare il listino.
- Test di regressione su richieste e preventivi esistenti.
- Migrazioni solo in ambiente test/preview autorizzato; nessuna operazione sul database di produzione senza approvazione esplicita.
- CI verde, review indipendente e approvazione tecnica prima del merge; deploy produzione solo con autorizzazione separata.

## 4. Gate aperti

- [ ] Tracciato il percorso reale di caricamento tariffe dal database al motore.
- [ ] Verificato se le tabelle tariffarie esistenti possono essere riutilizzate.
- [ ] Prezzi e conversioni approvati dal responsabile acquisti.
- [ ] Regole costruttive e distinta della parete campione approvate dal responsabile tecnico.
- [ ] Versionamento tariffario e retrocompatibilità definiti.
- [ ] Review indipendente e CI sul commit finale.

## 5. Confini

Questo è un piano di audit, non un'approvazione di prezzi o di produzione. Non modifica motore, tariffe, migrazioni, BOM, database o preventivi. Non autorizza merge o deploy.
