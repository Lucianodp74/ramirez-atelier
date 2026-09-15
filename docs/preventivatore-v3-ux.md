# Preventivatore V3 — UX cliente

## Obiettivo
Evolvere l'interfaccia del Preventivatore Modulare V2 verso un percorso guidato, visuale e mobile-first, prendendo spunto dal preventivatore mostrato dal cliente senza copiarne identità o flusso commerciale.

## Principi
- Il cliente non deve conoscere termini tecnici di falegnameria.
- Una decisione principale per volta.
- Materiale e finitura restano distinti.
- Il motore prezzi V2 resta server-side e non viene duplicato nella UI.
- La stima resta indicativa fino alla verifica professionale delle misure e del progetto.
- Home e modello 3D STELLA sono fuori scope.

## Percorso
1. **Cosa vuoi realizzare?** — Armadio, Parete attrezzata, Madia/Credenza, Libreria, Mobile bagno, Mobile su misura.
2. **Come deve essere?** — Lineare, Angolare, A parete, Più moduli.
3. **Quanto spazio abbiamo?** — Larghezza, altezza, profondità; misure indicative con limiti del modulo.
4. **Materiale** — Truciolare, MDF, Multistrato.
5. **Finitura** — Melaminico, Laminato, Laccato.
6. **Personalizza** — Aperto, ante, cassetti, ripiani.
7. **Riepilogo e stima** — stima commerciale calcolata dal Listino Ramirez attivo.
8. **Richiedi preventivo** — dati cliente e note progetto.

## Direzione visuale
Le card devono privilegiare fotografie/campioni reali quando disponibili. Nel repository sono già presenti immagini riutilizzabili:
- `/foto-elemento-parete-attrezzata.jpg`
- `/foto-elemento-credenza.jpg`
- `/foto-elemento-libreria.jpg`
- `/foto-elemento-mobile-tv.jpg`
- `/foto-elemento-altro-zona-giorno.jpg`
- `/foto-finiture.jpg`
- `/foto-venature-legno.jpg`
- `/foto-laboratorio.jpg`

Per le card senza fotografia specifica usare inizialmente una composizione grafica neutra, evitando immagini generate o stock finché non viene definita la libreria fotografica ufficiale.

## Stato tecnico
Questa specifica non modifica il motore V2, il Listino, la BOM, gli snapshot storici o la Home. L'implementazione UI può procedere per piccoli commit verificabili sulla PR #57.

## Fuori scope V3 iniziale
- CAD/CAM
- nesting
- apertura porte del modello STELLA
- pricing AI
- inserimento automatico di prezzi Ramirez
- modifica della Home
