# Editor interno per composizioni di pareti attrezzate — fase 1

## Stato implementazione

La prima interfaccia è disponibile nell'area operativa a `/admin/catalogo/librerie/editor`, raggiungibile dal Catalogo Librerie. L'accesso ripete il controllo `richiediContesto({ modulo: 'catalogo', azione: 'leggi' })`.

L'editor è deliberatamente senza persistenza: permette di modificare una composizione in memoria e copiare il JSON risultante, ma non scrive nel database né modifica direttamente il catalogo in codice. Il JSON esportato è una bozza dimostrativa e deve essere revisionato prima di essere aggiunto al catalogo.

## Funzioni incluse

- Partenza da uno dei modelli `BOZZA` esistenti.
- Aggiunta, rimozione e riordino di colonne e vani.
- Modifica di larghezza colonna, altezza vano, profondità, ripiani, ante e numero di cassetti.
- Selezione di schienale, materiale e finitura a partire dalle opzioni del catalogo Preventivatore.
- Ingombro complessivo, riepilogo elementi, errori di validazione e copia JSON.
- Nessuna variazione di listino, motore prezzi, BOM, schema Prisma o stato di pubblicazione.

## Vincoli e verifiche

- Riutilizzare `ComposizioneLibreria`, `moduliPreventivatoreDa`, `validaComposizione` e `CATALOGO_MODULI`.
- Nessun dato di costo interno è mostrato nell'editor.
- Non dichiarare una composizione pronta per la produzione sulla sola base della validazione del Preventivatore.
- Nessuna modifica a `main`, merge o deploy di produzione senza approvazione esplicita.
- Prima della review verificare type-check, lint, test pertinenti, formattazione, build e protezione della route.

## Blocco prima dell'uso produttivo

Prima di approvare modelli reali, Ramirez Atelier deve confermare: fianchi condivisi tra colonne, spessori, schienali, giunzioni, portata e passo dei ripiani, ferramenta, finiture reali e criterio di costo. L'attuale regola «un vano = un modulo» è un'approssimazione e può sovrastimare una parete composta da colonne adiacenti.

## Fuori perimetro

- Persistenza dinamica nel database e migrazioni.
- CAD/CAM, nesting, esportazione per macchine, editor 3D.
- Pubblicazione di modelli reali o uso di fotografie non approvate.
- Modifica dei prezzi o delle condizioni commerciali.
