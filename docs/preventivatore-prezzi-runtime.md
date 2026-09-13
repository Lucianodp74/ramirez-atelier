# Preventivatore — contratto prezzi runtime

## Obiettivo

Il Preventivatore non deve contenere prezzi commerciali o costi Ramirez hard-coded. Il Listino amministrativo è la fonte dei valori attivi; il motore li carica a ogni calcolo.

## Flusso

`Listino attivo → TariffePreventivatore → motore parametrico → stima → richiesta/BOM`

Una modifica a una voce del Listino diventa quindi effettiva al successivo calcolo, senza deploy e senza modifica del codice.

## Regole di integrità

1. Ogni tariffa tecnica è identificata da un codice stabile (`MAT-*`, `FIN-*`, `FER-*`, `MAN-*`, `COMM-*`).
2. Il codice non cambia quando cambia il prezzo o il nome descrittivo della voce.
3. L'unità di misura è parte del contratto: M2, ML, PZ, H, H/M2, H/PZ, EUR/H, %.
4. Solo voci `attivo = true` possono alimentare il calcolo.
5. Una tariffa mancante o con unità errata blocca il calcolo: mai usare un valore implicito o un prezzo demo.
6. Il prezzo corrente del Listino serve per nuovi calcoli; richieste/preventivi già consolidati conservano il proprio snapshot storico.
7. Il browser non decide il prezzo: il server ricalcola sempre usando il Listino corrente.
8. Il ricarico commerciale è una tariffa configurabile, non una costante nel frontend.

## Separazione dei livelli

- **Benchmark:** valori indicativi di mercato, mai fonte del preventivo Ramirez.
- **Costo Ramirez:** valori del Listino usati dal motore per stimare il costo produttivo.
- **Prezzo commerciale:** costo produttivo più ricarico e successive componenti commerciali previste dal workflow preventivo.
- **Snapshot storico:** valore osservato al momento della richiesta/preventivo, immutabile rispetto a futuri cambi Listino.

## Comportamento dopo una modifica

Esempio: `MAT-TRUCIOLARE` passa da 30 €/M2 a 36 €/M2.

- un nuovo calcolo usa 36 €/M2;
- una richiesta già salvata mantiene il proprio snapshot;
- non è necessario modificare il codice;
- non è necessario ricreare il catalogo;
- il test bench amministrativo deve mostrare immediatamente il nuovo risultato dopo il salvataggio della voce.

## Evoluzione

Nuovi materiali, finiture o costi tecnici devono essere introdotti aggiungendo nuove voci/codici e la relativa mappatura del motore. I prezzi non devono mai essere copiati nei componenti React, nelle Server Actions o nei test come valori produttivi reali.

I valori usati nei test automatici devono essere fixture esplicite e non rappresentano prezzi ufficiali Ramirez.
