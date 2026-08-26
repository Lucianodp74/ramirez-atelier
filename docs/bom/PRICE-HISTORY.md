# Storico prezzi BOM

Ogni valorizzazione iniziale e ogni modifica del costo unitario di una riga BOM viene registrata in `bom_riga_prezzo_storico`.

Lo storico conserva:

- costo precedente;
- nuovo costo;
- tipo di evento (`INSERIMENTO` o `MODIFICA`);
- utente e membership che hanno effettuato l'operazione;
- data/ora.

Il benchmark di mercato non viene modificato: lo storico riguarda esclusivamente il costo effettivo utilizzato nella BOM.
