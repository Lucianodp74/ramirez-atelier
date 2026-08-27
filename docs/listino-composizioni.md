# Distinta delle composizioni del Listino Atelier

Le voci `COMPOSIZIONE` del Listino Atelier possono avere una distinta interna di materiali e componenti.

- il prezzo della composizione resta indipendente dal costo della distinta;
- quando si aggiunge un componente, il suo prezzo corrente viene copiato come `costoUnitario` snapshot;
- modificare in seguito il prezzo del componente non modifica retroattivamente la distinta già costruita;
- la quantità della riga resta modificabile;
- il costo della distinta è la somma di `quantita × costoUnitario`.

Questo prepara il passaggio successivo verso lavorazioni, tempi e pricing commerciale senza confondere costo interno e prezzo di listino.
