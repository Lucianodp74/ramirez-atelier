# Ramirez Atelier — Armadi V1

## Obiettivo
Portare un solo flusso completo e dimostrabile dal configuratore cliente alla commessa, senza modificare `main` finché la V1 non è verificata.

## Flusso cliente
- [x] Tipo progetto: armadio
- [x] Dimensioni complessive
- [x] Composizione a moduli
- [x] Controllo dimensioni totali
- [x] Interni: ripiani/cassetti/appendiabiti
- [x] Ante/frontali
- [x] Materiale
- [x] Finitura
- [x] Ferramenta/accessori
- [x] Riepilogo leggibile
- [x] Stima indicativa
- [x] Invio richiesta

## Flusso falegnameria
- [x] Richiesta ricevuta con configurazione strutturata
- [x] Modifica/verifica tecnica
- [x] Costo produzione separato dalla stima cliente
- [x] Margine e prezzo preventivo
- [x] BOM verificabile
- [x] Conferma BOM
- [x] Creazione/aggiornamento commessa

## Stato
Armadi V1 è stata collaudata e mergiata su `main`. Il collaudo 240 × 260 × 60 è positivo.

## Prezzi
- Il Preventivatore usa un solo motore.
- Il prezzo falegname è derivato dallo stesso costo di produzione.
- Per Ramirez il prezzo privato/architetto applica il ricarico commerciale del 40% configurato nel Listino.
- Il cliente riceve solo la stima indicativa.
- Costo produzione e prezzo falegname restano dati interni.

## Regole V1
- Non mostrare al cliente costo produzione, ore o ricarico interno.
- La BOM generata dal cliente resta BOZZA.
- La BOM CONFERMATA è la sola fonte per la commessa.
- Non introdurre cucina in questa milestone.
- Non toccare `main` prima del collaudo.
