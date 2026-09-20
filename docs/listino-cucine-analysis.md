# Analisi listino cucine esterno

## Obiettivo

Usare un listino completo di un'azienda di cucine come fonte di studio per migliorare il modello del Preventivatore Ramirez Atelier.

Il documento sorgente verrà analizzato senza importare automaticamente prezzi o condizioni commerciali nel Listino Ramirez.

## Regole

1. Il listino esterno è una fonte di struttura, terminologia e benchmark.
2. I prezzi dell'azienda esterna non diventano prezzi Ramirez senza validazione esplicita.
3. Non si modificano Home, STELLA o il motore tecnico V2 durante l'analisi.
4. Le informazioni storiche eventualmente importate nel sistema devono conservare la loro provenienza.
5. Materiale e finitura restano concetti distinti.
6. Le regole commerciali dell'azienda esterna non vengono assunte come regole Ramirez.

## Cosa estrarre

### 1. Famiglie di prodotto

- basi
- pensili
- colonne
- cassettiere
- moduli speciali
- elementi terminali
- elementi angolari
- accessori
- eventuali categorie aggiuntive

### 2. Dimensionamento

Per ogni famiglia individuare, se presenti:

- larghezze disponibili
- altezze disponibili
- profondità disponibili
- incrementi dimensionali
- vincoli e incompatibilità
- dimensioni speciali/su misura

### 3. Costruzione

Individuare la presenza di:

- fianchi
- fondo/base
- cielo
- schienale
- ripiani
- ante
- frontali cassetto
- cassetti
- zoccolo
- ferramenta
- lavorazioni
- elementi di montaggio

### 4. Materiali e finiture

Separare chiaramente:

- materiale/supporto
- finitura superficiale
- bordo
- schienale
- frontali
- eventuali materiali speciali

### 5. Pricing

Rilevare la logica, non importare direttamente i prezzi:

- prezzo per pezzo
- prezzo per metro lineare
- prezzo per m²
- maggiorazioni
- optional
- sovrapprezzi per finitura
- sovrapprezzi per dimensioni
- sconti
- fasce o categorie di prezzo
- eventuali regole di composizione

### 6. Codici articolo

Se presenti:

- codice
- descrizione
- famiglia
- variante
- dimensione
- materiale
- finitura
- prezzo
- unità

## Mappatura verso Ramirez

La mappatura dovrà classificare ogni elemento come:

- `DIRETTAMENTE_RIUTILIZZABILE`
- `ADATTABILE`
- `SOLO_BENCHMARK`
- `NON_NECESSARIO`
- `DA_VALIDARE`

## Output atteso

Al termine dell'analisi produrre:

1. una mappa delle categorie del listino esterno;
2. una mappa delle categorie equivalenti Ramirez;
3. le nuove entità/moduli eventualmente utili;
4. le nuove regole dimensionali eventualmente utili;
5. le nuove componenti BOM eventualmente utili;
6. le nuove unità di listino eventualmente necessarie;
7. le regole di pricing che possono essere generalizzate;
8. ciò che non deve essere importato;
9. eventuali gap del Preventivatore Ramirez;
10. una proposta di fase successiva separata dall'analisi.

## Stato

- [ ] Ricezione del listino esterno
- [ ] Analisi completa
- [ ] Estrazione categorie
- [ ] Estrazione componenti
- [ ] Estrazione dimensioni
- [ ] Estrazione materiali/finiture
- [ ] Analisi della logica prezzo
- [ ] Mappatura verso Ramirez
- [ ] Validazione delle proposte
- [ ] Eventuale implementazione

## Nota

Questa branch serve alla sola analisi e preparazione. Nessun prezzo reale Ramirez deve essere inventato o derivato automaticamente dal documento esterno.
