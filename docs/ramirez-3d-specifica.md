# Ramirez 3D — Specifica funzionale e tecnica

**Stato:** approvata per sviluppo  
**Branding:** Ramirez Atelier + rivenditore  
**Prezzi:** riservati al rivenditore; mai esposti nella presentazione cliente.

## Obiettivo
Realizzare una piattaforma per pubblicare presentazioni di progetti d'arredo su misura, con modello 3D interattivo, render, materiali, finiture e documentazione. Il cliente finale accede tramite link non autenticato e in sola lettura; il rivenditore gestisce la presentazione dall'area riservata esistente.

## Ruoli e visibilità
- **Staff/Ramirez:** crea e revisiona i progetti, carica modelli e render, pubblica e revoca link.
- **Rivenditore autenticato:** consulta la parte commerciale riservata, gestisce la propria identità grafica e condivide la presentazione.
- **Cliente tramite link:** vede solo la revisione pubblicata, il modello 3D, i render, la descrizione, materiali/finiture e documenti esplicitamente pubblicati.

Il prezzo, i margini, gli sconti, i costi, la distinta base, le note interne, i dati CRM e i documenti preventivo non fanno parte del payload pubblico. Il PDF con prezzo resta accessibile solo agli utenti autenticati e autorizzati.

## Pagina cliente
Percorso previsto: `/progetto/[token]`.
1. Header con identità Ramirez Atelier e identità del rivenditore (nome e logo facoltativo).
2. Titolo e descrizione del progetto.
3. Viewer GLB/glTF interattivo (rotazione, zoom, pan, fullscreen; controlli touch).
4. Galleria render/fotografie.
5. Scheda materiali, essenze, colori, finiture, dimensioni e note approvate.
6. Documenti pubblicati esplicitamente.
7. Codice progetto e revisione, data pubblicazione e contatto del rivenditore.
8. Nessun prezzo o dato economico.

## Dati e versionamento
Separare il contenitore del progetto dalla sua revisione pubblicata:
- `PresentazioneProgetto`: tenant, richiesta collegata opzionale, rivenditore, stato, token hash, scadenza/revoca, branding e revisione corrente.
- `VersionePresentazione`: numero revisione, snapshot immutabile dei contenuti pubblicabili, autore e data pubblicazione.
- `AssetPresentazione`: file GLB/glTF, render, immagini e documenti, con MIME, dimensione, chiave storage, categoria e flag pubblicato.

Ogni pubblicazione crea una nuova revisione; le revisioni precedenti non vengono sovrascritte. Il token è generato crittograficamente, nel database si conserva solo il suo hash. Possibilità di scadenza, revoca e rigenerazione del link. Non riutilizzare `tokenRipresa`, che serve a riprendere la richiesta.

## Sicurezza
- Ogni query amministrativa deve verificare sessione, permesso e tenant.
- Il resolver pubblico riceve solo token, ne calcola l'hash e verifica stato attivo, scadenza e revoca.
- Il resolver restituisce una DTO allowlist costruita campo per campo; vietato serializzare direttamente record Prisma o `datiEstensione`.
- Gli asset restano privati nello storage; l'accesso passa da endpoint autorizzato e URL firmati a breve durata.
- Mai esporre URL storage permanenti, chiavi storage, email/telefono del cliente, note interne, BOM o dati commerciali.
- Rate limit per token/IP e logging degli accessi senza registrare il token in chiaro.
- Le route pubbliche non devono importare o richiamare servizi di preventivazione.

## Storage e formati
Usare l'adapter S3/local già presente. Aggiungere classificazione esplicita per `.glb` e `.gltf` (e relativi asset dipendenti); valutare `.usdz` come estensione futura. Limiti di dimensione, MIME allowlist e validazione estensione/MIME sono obbligatori. GLB è il formato preferito per la prima release perché riduce la gestione di file esterni.

## API e UI previste
- Admin: crea/modifica bozza, carica asset, gestisce branding e contenuti, pubblica nuova revisione, revoca/rigenera link.
- Pubblica: recupera presentazione tramite token valido; recupera singolo asset solo se collegato a una revisione pubblicata.
- Rivenditore: dati economici e PDF continuano a usare le API autenticate esistenti; non vengono duplicati nell'API pubblica.

## Fasi di sviluppo
1. Fondazioni: schema Prisma, migrazione, servizi token/hash e test di isolamento tenant.
2. Asset: upload GLB/render, MIME e categorie 3D, accesso firmato e test.
3. Pubblicazione: snapshot immutabili, pagina pubblica e viewer riutilizzabile.
4. Gestione: UI admin/rivenditore per bozza, anteprima, pubblicazione, revoca e co-branding.
5. Collaudo: test di sicurezza (token scaduto/revocato, tenant errato, asset non pubblicato, tentativi di leggere prezzi), mobile, Safari/iOS, accessibilità e performance.

## Criteri di accettazione
- Il cliente vede il modello 3D e soltanto i contenuti pubblicati.
- Nessuna risposta pubblica contiene prezzo, fascia prezzo, BOM, margine, note interne o dati CRM.
- Link revocato/scaduto non restituisce contenuti o asset.
- Una nuova revisione non modifica una revisione già pubblicata.
- Rivenditore e Ramirez Atelier sono entrambi rappresentati nella pagina.
- Tutte le operazioni amministrative sono tenant-scoped e autorizzate.
- Il preventivo con prezzo resta nell'area riservata già esistente.

## Decisioni per il pilot
Usare un progetto reale con un GLB esportato dal CAD/SketchUp e render Enscape; partire con un solo modello GLB, una galleria di render e contenuti descrittivi. Non importare interi repository esterni: riusare `model-viewer`, già presente nell'app, e gli adapter storage esistenti.
