# RAMIREZ OS — BOM / Distinta di produzione

## Scopo

La BOM collega una `RichiestaProgetto` a una distinta di produzione senza alterare i dati storici della richiesta.

## Struttura logica

- `BOM` — intestazione della distinta, collegata a una richiesta e al tenant.
- `BOMRiga` — componente/materiale/lavorazione, con codice, descrizione, unita, quantita e note.
- `BOM` deve avere uno stato (`BOZZA`, `CONFERMATA`, `CHIUSA`) e timestamp di creazione/modifica.
- Le righe devono mantenere un ordine esplicito.

## Regole

1. Ogni lettura/scrittura deve essere filtrata per `tenantId`.
2. Una richiesta puo avere una sola BOM attiva; eventuali revisioni devono essere esplicite.
3. Quantita e costi non devono essere derivati da valori inventati dal frontend.
4. Il costo materiale deve provenire dal catalogo/prezzi professionali quando disponibile.
5. Il configuratore alimenta la BOM solo attraverso regole dichiarate per il tipo di progetto.
6. La BOM non modifica `datiFormJson`: lo interpreta e conserva il risultato della distinta separatamente.
7. La pubblicazione della BOM richiede una migration Prisma applicata e testata nell'ambiente del progetto.

## Sequenza di integrazione

`RichiestaProgetto` → `BOM` → `BOMRiga` → Pricing/Costing → Preventivo → Produzione

## Stato

Questo documento definisce il contratto di implementazione. La migration e il servizio applicativo vanno aggiunti in una modifica separata e verificati con Prisma/CI prima del merge su `main`.
