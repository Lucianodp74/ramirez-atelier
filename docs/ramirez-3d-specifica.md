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


## Ricerca tecnica SKP — decisione architetturale (2026-11-12)

### Candidato scelto: OpenSKP
Repository: https://github.com/iamahsanmehmood/openskp  
Pacchetto TypeScript: `openskp` 1.5.0 — licenza dichiarata MIT.

OpenSKP è un parser/writer/converter indipendente per SketchUp. La versione TypeScript dichiara supporto al contenitore VFF (SketchUp 2021+) e al formato MFC classico (2013–2020), con lettura di geometrie, gerarchie di componenti, layer/tag, materiali, texture e attributi. Espone parsing browser da ArrayBuffer, costruzione scena triangolata e conversione GLB. Il progetto include un viewer web drag-and-drop Three.js utilizzabile come riferimento d'implementazione.

### Limiti e rischi da verificare
- Il progetto è giovane e in evoluzione; le dichiarazioni di compatibilità vanno provate sui file SKP effettivamente usati da Ramirez.
- Il supporto reale alle versioni storiche non è universale: i test pubblicati riportano eccezioni per alcuni file molto vecchi/corrotti.
- La documentazione TypeScript segnala uso di memoria elevato sui file grandi: 113 MB possono richiedere 8–16 GB di heap Node e oltre circa 150–200 MB il browser può non riuscire a completarli.
- La build scene può moltiplicare la geometria quando componenti ripetuti vengono espansi. Valutare `buildInstancedScene()` e `toInstancedGLB()` per arredi modulari/ripetitivi.
- Verificare fedeltà di UV, texture, materiali fronte/retro, componenti dinamici, unità, assi e scene/camere sui modelli reali.
- La licenza MIT dichiarata consente l'integrazione commerciale secondo i termini della licenza; conservare avviso e testo licenza nella distribuzione.

### Decisione di integrazione
Non sostituire il viewer GLB esistente. Introdurre una pipeline d'importazione:
1. Il rivenditore carica un file SKP nell'area autenticata.
2. Validazione estensione, MIME, dimensione e tenant.
3. OpenSKP analizza il file e produce anteprima/metadata (versione SketchUp, dimensioni, materiali, componenti, layer).
4. Conversione in GLB, preferibilmente preservando istanze dove compatibile.
5. Preview immediata nel viewer Ramirez esistente.
6. L'utente verifica il risultato e pubblica una revisione; SKP originale e GLB derivato sono conservati come asset distinti e privati.
7. Il link cliente espone solo GLB e contenuti pubblicati; mai il file sorgente SKP salvo esplicita scelta futura.

### Dove eseguire la conversione
Per un primo MVP si può provare la conversione lato browser nell'area riservata, con progress e limiti rigidi; il file originale resta sul dispositivo fino al completamento. Prima della produzione, preferire un worker/server dedicato per file grandi, timeout, isolamento e gestione memoria. Non eseguire parsing SKP nella pagina pubblica del cliente.

### Alternative esaminate
- Trimble SketchUp C SDK: API ufficiale per leggere/scrivere SKP da applicazioni standalone C/C++; richiede accesso al Desktop SDK e introduce dipendenza/licenza/ambiente operativo. Soluzione più ufficiale ma più onerosa operativamente.
- `skp_viewer` (lihang185): viewer C++/PyQt5/OpenGL, supporta solo varianti SKP 15/17 testate e non è adatto come componente Next.js/browser.
- `skpwright` (hew3d): reader/writer clean-room Rust con specifica e C ABI; interessante alternativa da monitorare, ma non offre lo stesso percorso immediato di integrazione browser TypeScript già pronto.
- `johnmcm.com/skp-viewer`: dimostrazione web concreta basata su OpenSKP, utile per verificare il flusso drag-and-drop; non è una dipendenza da incorporare senza valutare licenza e architettura del sito.
- `Spatial-AR-Furniture-Configurator`: spunto per UI e personalizzazione di materiali/parti, ma lavora con GLB/glTF e non risolve l'importazione SKP.

### Test di accettazione prima dell'adozione definitiva
Usare almeno 5 file reali Ramirez: SKP 2019/2020, SKP 2021+, un modello con texture, uno con componenti ripetuti e uno di dimensioni elevate. Confrontare screenshot SketchUp/Enscape con preview Ramirez; controllare misure, orientamento, UV, texture, colori, trasparenze, gerarchia e numero di mesh. Misurare tempi e picco memoria su desktop e mobile. Se un file non supera il test, offrire GLB esportato da SketchUp come fallback.

### Fonti consultate
- https://github.com/iamahsanmehmood/openskp
- https://iamahsanmehmood.github.io/openskp/docs/
- https://github.com/lihang185/skp_viewer
- https://github.com/hew3d/skpwright
- https://extensions.sketchup.com/developers/sketchup_c_api/sketchup/index.html
- https://developer.trimble.com/docs/sketchup/tools/sdk
- https://johnmcm.com/skp-viewer


## Implementazione prototipale OpenSKP — primo collegamento

Nel branch `feat/ramirez-3d-presentazioni` è stato aggiunto:
- dipendenza `openskp@1.5.0` e relative voci package-lock;
- componente `ImportaSKPViewer` inserito nella scheda amministrativa della richiesta;
- conversione lazy nel browser con `buildInstancedScene()` + `toInstancedGLB({ textures: true })`;
- preservazione delle istanze dei componenti ripetuti e incorporamento delle texture supportate;
- anteprima GLB nel componente `Modello3DViewer` esistente e download del GLB risultante.

### Limiti dichiarati del prototipo
- Il componente limita l'importazione a 40 MB e non avvia il parsing nella pagina pubblica cliente.
- La conversione avviene localmente nel browser: il componente non carica automaticamente né SKP né GLB nello storage. Il GLB può essere scaricato; il collegamento al caricamento autenticato e alla pubblicazione versionata è un incremento successivo.
- Non è ancora una pipeline server/worker e non offre ripresa automatica in caso di chiusura della pagina.
- Non è ancora verificato su modelli reali Ramirez; la fedeltà di texture/materiali/componenti deve essere misurata con file campione.
- Prima del merge occorre eseguire `npm ci`, `npm run type-check`, `npm run lint`, `npm test` e `npm run build`. Il lockfile è stato aggiornato strutturalmente dal lockfile upstream per le dipendenze OpenSKP, ma va validato con npm CI.

