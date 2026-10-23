# Gestione del listino operativo — pareti attrezzate

## File operativi

- [Listino operativo CSV](./listino-operativo-pareti-attrezzate.csv): anagrafica articoli con codici interni stabili, categoria, unità di acquisto/calcolo, prezzo corrente da confermare e stato.
- [Storico rilevazioni prezzo CSV](./storico-prezzi-pareti-attrezzate.csv): una riga per ogni rilevazione, senza sovrascrivere il prezzo storico.
- [Listino base e criteri](./listino-base-pareti-attrezzate.md): criteri di valorizzazione e gate di approvazione.
- [Scheda tecnica parete campione](./scheda-tecnica-composizione-parete-campione.md): raccolta delle regole tecniche da approvare.

I CSV sono delimitati da punto e virgola per favorire l'apertura in Excel con impostazioni italiane. Conservare i codici articolo, non cambiare l'unità di misura senza creare una nuova versione/nota e non usare i campi DA DEFINIRE per ordini o preventivi.

## Stati ammessi

- DA VERIFICARE: voce generica o prezzo non ancora confermato dal falegname.
- CONFERMATO: articolo, codice fornitore, unità, prezzo e condizioni controllati su offerta/fattura.
- SCADUTO: prezzo non più valido o offerta scaduta.
- NON UTILIZZARE: articolo non approvato o non più acquistabile.

Le rilevazioni pubbliche nello storico sono benchmark: non sostituiscono le offerte professionali. La data di rilevazione non garantisce che la pagina o il prezzo siano ancora disponibili.

## Aggiornamento da parte del falegname

1. Individuare il codice interno esistente o crearne uno nuovo se cambia articolo, finitura, spessore o unità.
2. Ottenere offerta/fattura e identificare codice prodotto, fornitore, prezzo netto, IVA, confezione, trasporto e validità.
3. Aggiungere una riga allo storico con la data della nuova rilevazione.
4. Aggiornare l'anagrafica con il prezzo netto corrente, la data, la fonte e lo stato CONFERMATO solo dopo controllo umano.
5. Conservare le rilevazioni precedenti. Non sostituire una vecchia riga nello storico.
6. Non inserire margine commerciale nel costo di acquisto: la regola del prezzo di vendita deve essere approvata separatamente.

## Unità e costo unitario

Il campo prezzo_netto deve rappresentare il costo netto di acquisto per unita_acquisto. Il campo quantita_per_unita indica quante unita_calcolo contiene l'unità acquistata. Il prezzo unitario netto si calcola dividendo il prezzo netto d'acquisto per la quantità contenuta, dopo aver normalizzato la conversione delle unità.

Non valorizzare un articolo a metro quadro se il fornitore lo vende a pannello senza registrare la superficie utile e gli eventuali sfridi. Le tariffe di lavorazione vanno distinte dal costo dei materiali.

## Collegamento all'app: non ancora abilitato

La PR #116 dichiara che il catalogo librerie è definito in src/lib/catalogo-librerie/catalogo.ts, che il Preventivatore usa il proprio catalogo di moduli e motore di stima, e che non esiste ancora una gestione amministrativa persistente del listino. La pagina Catalogo Librerie afferma che nessun prezzo è salvato nel catalogo e la stima viene calcolata dal Preventivatore.

Per questo motivo i CSV sono strumenti di raccolta e manutenzione, non sono ancora letti dall'app e non modificano il prezzo di un preventivo. Prima di collegarli al motore di stima occorre esaminare calcolaStimaPreventivatore, le strutture della BOM e i test pertinenti, concordare la regola di costo e verificare l'impatto su preventivi esistenti. Nessuna migrazione o modifica al motore prezzi è inclusa in questa fase.

## Sicurezza tecnica

Le descrizioni generiche di pannelli e ferramenta non sono specifiche di produzione. Portate, interassi, fissaggi, ancoraggi, spessori strutturali e compatibilità devono provenire dalle schede tecniche dei prodotti scelti ed essere approvati dal responsabile tecnico. Non usare i CSV come distinta definitiva finché la parete campione non è verificata.
