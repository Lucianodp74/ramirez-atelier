# Creazione commessa: gestione errori

La Server Action di creazione commessa restituisce ora un risultato discriminato invece di propagare l'eccezione al renderer RSC. In questo modo eventuali errori runtime della mutation vengono mostrati nel pannello admin e non come errore generico di Server Components.

La mutation resta transazionale e non viene alterata nella logica di creazione/snapshot della BOM.
