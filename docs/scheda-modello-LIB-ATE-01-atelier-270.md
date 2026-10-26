# Scheda modello — LIB-ATE-01 | Atelier 270

> **STATO: BOZZA DIMOSTRATIVA — NON APPROVATA.** Questa scheda è coerente con il
  modello software presente in `src/lib/catalogo-librerie/catalogo.ts` e con la
  `scheda-tecnica-composizione-parete-campione.md`. Descrive esclusivamente i
  dati demo attualmente registrati. Non è un disegno esecutivo, una distinta
  base, un preventivo né un'autorizzazione alla produzione.

## 1. Identificazione

- Campo: Codice modello; Dato: `LIB-ATE-01`
- Campo: Nome catalogo; Dato: Atelier 270
- Campo: Famiglia; Dato: Linea Atelier
- Campo: Stato catalogo; Dato: BOZZA
- Campo: Modello dimostrativo; Dato: Sì
- Campo: Visibilità pubblica / richiedibilità; Dato: Non visibile al pubblico;
  non richiedibile in quanto bozza
- Campo: Fonte dei dati; Dato: `src/lib/catalogo-librerie/catalogo.ts`
- Campo: Scheda tecnica di validazione; Dato: [Scheda tecnica — composizione
  campione di parete attrezzata](scheda-tecnica-composizione-parete-campione.md)

## 2. Descrizione del concept

Composizione dimostrativa a tre colonne affiancate, ciascuna con un contenitore
inferiore chiuso da ante e un vano aperto superiore. Il concept serve a
verificare la rappresentazione dei vani nel configuratore e a preparare la
futura validazione dei componenti fisici.

## 3. Configurazione presente nel software

- Caratteristica: Numero colonne; Dato registrato: 3; Stato: Demo
- Caratteristica: Larghezza colonna 1; Dato registrato: 90 cm; Stato: Demo
- Caratteristica: Larghezza colonna 2; Dato registrato: 90 cm; Stato: Demo
- Caratteristica: Larghezza colonna 3; Dato registrato: 90 cm; Stato: Demo
- Caratteristica: Larghezza totale risultante dalla somma delle colonne; Dato
  registrato: 270 cm; Stato: Da verificare su disegno approvato
- Caratteristica: Altezza vano inferiore per colonna; Dato registrato: 80 cm;
  Stato: Demo
- Caratteristica: Altezza vano aperto superiore per colonna; Dato registrato:
  160 cm; Stato: Demo
- Caratteristica: Altezza totale risultante dalla somma dei vani; Dato
  registrato: 240 cm; Stato: Da verificare su disegno approvato
- Caratteristica: Profondità registrata; Dato registrato: 40 cm; Stato: Demo
- Caratteristica: Ripiani del vano aperto superiore; Dato registrato: 3 per
  colonna; Stato: Demo
- Caratteristica: Ante del vano inferiore; Dato registrato: 2 per colonna;
  Stato: Demo
- Caratteristica: Ripiano registrato nel vano inferiore; Dato registrato: 1 per
  colonna; Stato: Demo; verificare se corrisponde alla costruzione prevista
- Caratteristica: Schienale; Dato registrato: Flag presente nel modello; Stato:
  Costruzione e fissaggio da definire
- Caratteristica: Materiale registrato; Dato registrato: Truciolare; Stato: Non
  approvato
- Caratteristica: Finitura registrata; Dato registrato: Melaminico; Stato: Non
  approvata

**Nota sulle misure:** le altezze 80 + 160 cm descrivono la somma dei vani
configurati nel software; non attestano l'ingombro esterno definitivo. Spessori
dei pannelli, basamento, cielo, giochi, piedini e altre eventuali parti non sono
definiti in questa scheda. Non dedurre quote produttive da questi totali.

## 4. Aspetto e distribuzione funzionale

- **Parte inferiore:** tre basi con ante, una per colonna.
- **Parte superiore:** tre vani aperti, uno per colonna, con tre ripiani
  indicati nel dato demo per ciascun vano.
- **Composizione:** colonne affiancate; la modalità di costruzione dei fianchi
  adiacenti (condivisi o duplicati) è ancora da approvare.
- **Ante:** il dato software prevede due ante per ciascuna base; apertura,
  cerniere, luce tra ante e dimensioni frontali non sono definite.
- **Schienale:** la presenza è indicata come valore booleano; materiale,
  spessore, incasso e fissaggio non sono specificati.

## 5. Elementi non definiti — non dedurre

Questa scheda non definisce:

- spessori e codici dei pannelli;
- dimensioni di taglio dei singoli componenti;
- fianchi condivisi, divisori, cielo, base e dettagli delle giunzioni;
- bordature, forature, fresature e tolleranze;
- ferramenta, supporti ripiano, cerniere e sistemi di apertura;
- ancoraggio alla parete e condizioni di installazione;
- portate ammesse dei ripiani;
- materiale e spessore effettivi dello schienale;
- distinta fisica, sfridi, tempi e costi;
- imballaggio, trasporto e montaggio.

Questi dati devono derivare dal disegno quotato, dalle schede dei materiali e
della ferramenta e dalla distinta verificata e approvata dal responsabile
tecnico.

## 6. Verifiche necessarie prima di qualsiasi uso produttivo

- [ ] Confermare che `LIB-ATE-01 — Atelier 270` sia il campione scelto.
- [ ] Allegare e identificare il disegno quotato approvato.
- [ ] Verificare larghezza, altezza esterna, profondità e tolleranze.
- [ ] Approvare materiali, finiture e spessori.
- [ ] Approvare la regola dei fianchi tra colonne adiacenti.
- [ ] Definire giunzioni, ferramenta, schienale e ancoraggi.
- [ ] Verificare luci e portate dei ripiani.
- [ ] Produrre e verificare la distinta dei componenti fisici.
- [ ] Confrontare un campione reale con disegno e distinta.
- [ ] Tradurre le regole approvate in controlli software e test automatici.
- [ ] Registrare approvatore, data, versione ed esito.

## 7. Approvazione e tracciabilità

- Campo: Disegno quotato e versione; Da compilare: Da definire
- Campo: Distinta base e versione; Da compilare: Da definire
- Campo: Responsabile tecnico; Da compilare: Da indicare
- Campo: Data revisione; Da compilare: Da indicare
- Campo: Esito; Da compilare: Da compilare
- Campo: Riferimento approvazione tracciabile; Da compilare: Da indicare
- Campo: Limitazioni d'uso approvate; Da compilare: Da indicare

**Uso consentito nello stato attuale:** riferimento descrittivo per sviluppo e
verifica del configuratore. I dati restano dimostrativi; la scheda non autorizza
produzione, acquisto materiali, installazione o preventivi definitivi.

---
*Documento di lavoro collegato alla scheda tecnica di validazione. Aggiornare i
dati solo sulla base di fonti identificate e approvate; non trasformare i valori
demo in specifiche tecniche per semplice copia.*
