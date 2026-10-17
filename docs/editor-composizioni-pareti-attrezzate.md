# Editor interno per composizioni di pareti attrezzate — fase 1

## Obiettivo

Aggiungere un editor interno che consenta di comporre e verificare modelli di parete usando il catalogo librerie e il Preventivatore già esistenti, senza introdurre un secondo catalogo, un secondo motore prezzi o una migrazione database.

## Perimetro della prima iterazione

- Riutilizzare `ComposizioneLibreria`, `moduliPreventivatoreDa`, `validaComposizione` e `CATALOGO_MODULI`.
- Consentire di partire da un modello esistente in stato `BOZZA`.
- Modificare colonne e vani ordinati dal basso verso l'alto, con larghezze, altezze, profondità, ripiani, ante e cassetti.
- Mostrare ingombro complessivo, riepilogo degli elementi ed errori di validazione.
- Generare una rappresentazione della composizione riutilizzabile nel catalogo in codice.
- Mantenere l'editor esclusivamente nell'area autenticata; nessuna composizione diventa pubblica automaticamente.

## Vincoli

- Non cambiare prezzi, listino, regole commerciali, BOM o schema Prisma.
- Non approvare automaticamente modelli dimostrativi.
- Nessun dato di costo interno deve essere mostrato a utenti pubblici.
- Non dichiarare una composizione pronta per la produzione sulla sola base della validazione del Preventivatore.
- Nessuna modifica a `main`, merge o deploy senza approvazione esplicita.

## Verifiche necessarie

1. Test unitari per aggiunta/rimozione e riordino di colonne e vani, identificativi univoci e composizioni vuote.
2. Test di validazione per limiti dimensionali, tipi di vano e combinazioni di ante/cassetti/ripiani.
3. Test di regressione: traduzione nei `ModuloConfigurato[]` e motore prezzi invariati.
4. Verifica che bozze e anteprime restino protette dall'autenticazione e non siano accessibili al pubblico.
5. Type-check, lint, test pertinenti, formattazione e build in CI prima della review.

## Blocco prima dell'uso produttivo

Prima di approvare modelli reali, Ramirez Atelier deve confermare: fianchi condivisi tra colonne, spessori, schienali, giunzioni, portata e passo dei ripiani, ferramenta, finiture reali e criterio di costo. L'attuale regola «un vano = un modulo» è un'approssimazione e può sovrastimare una parete composta da colonne adiacenti.

## Fuori perimetro

- Persistenza dinamica nel database e migrazioni.
- CAD/CAM, nesting, esportazione per macchine, editor 3D.
- Pubblicazione di modelli reali o uso di fotografie non approvate.
- Modifica dei prezzi o delle condizioni commerciali.

## Criterio di completamento

L'editor è accettabile quando permette di preparare una composizione valida e riproducibile, senza cambiare le stime o i flussi esistenti, e i test automatici dimostrano che la conversione usa ancora il Preventivatore esistente.