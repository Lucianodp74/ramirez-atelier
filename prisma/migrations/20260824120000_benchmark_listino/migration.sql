CREATE TABLE "benchmark_prezzo" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "codice" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descrizione" TEXT,
    "unita" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "prezzoMin" DECIMAL(12,2) NOT NULL,
    "prezzoMax" DECIMAL(12,2) NOT NULL,
    "valuta" TEXT NOT NULL DEFAULT 'EUR',
    "fonte" TEXT NOT NULL,
    "fonteUrl" TEXT NOT NULL,
    "rilevatoIl" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "attivo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "benchmark_prezzo_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "benchmark_prezzo_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "benchmark_prezzo_tenantId_codice_key" ON "benchmark_prezzo"("tenantId", "codice");
CREATE INDEX "benchmark_prezzo_tenantId_categoria_attivo_idx" ON "benchmark_prezzo"("tenantId", "categoria", "attivo");

INSERT INTO "benchmark_prezzo"
("id","tenantId","categoria","codice","nome","descrizione","unita","tipo","prezzoMin","prezzoMax","fonte","fonteUrl","rilevatoIl","note")
VALUES
('bench_noce_canaletto_19_1250_3030','tenant_ramirez_atelier','materiale','NOCE-CAN-19-1250-3030','Listellato Noce Canaletto 19 mm 1250×3030','Pannello listellare 7 strati, formato 1250×3030 mm.','pz','COSTO',232.84,258.71,'Brico Legno Store','https://www.bricolegnostore.it/listellato-noce-canaletto-a-7-strati-mm-19-x-1250-x-3030-detail.html','2026-08-24 00:00:00','Intervallo tra prezzo rilevato in offerta e prezzo di listino della stessa referenza; spedizione esclusa.'),
('bench_listellare_massello_19','tenant_ramirez_atelier','materiale','LISTELLARE-MASS-19-M2','Listellare massello 19 mm','Benchmark generico per pannello listellare in legno massello.','m2','COSTO',64.90,75.50,'Pannello su Misura','https://pannellosumisura.it/prodotti/legno/legno-listellare/','2026-08-24 00:00:00','Valori pubblicati per Noce Tanganica e Rovere; non specifici per Noce Canaletto.'),
('bench_bordo_noce_canaletto','tenant_ramirez_atelier','materiale','BORDO-NOCE-CAN-PRECOLLATO','Bordo Noce Canaletto precollato','Bordo in legno Noce Canaletto, larghezza 22 mm.','m','COSTO',0.85,0.85,'Brico Legno Store','https://www.bricolegnostore.it/bordi-in-legno-e-melaminici-precollati/bordi-in-legno/bordo-legno-in-noce-canaletto-precollato-al-metro-detail.html','2026-08-24 00:00:00','Prezzo pubblicato per metro; spedizione esclusa.'),
('bench_cerniera_blum_110','tenant_ramirez_atelier','ferramenta','BLUM-110-STANDARD','Cerniera Blum standard 110°','Cerniera CLIP top standard 110°, senza BLUMOTION.','pz','COSTO',2.83,3.48,'Venerota Store','https://store.venerota.it/cerniera-standard-110-senza-blumotion-per-mobili-blum','2026-08-24 00:00:00','Range tra varianti 71T3550/71T3650/71T3750 pubblicate dal rivenditore.'),
('bench_cerniera_blumotion_110','tenant_ramirez_atelier','ferramenta','BLUM-110-BLUMOTION','Cerniera Blum CLIP top BLUMOTION 110°','Cerniera 110° con ammortizzazione BLUMOTION.','pz','COSTO',5.66,6.95,'Venerota Store','https://store.venerota.it/blum','2026-08-24 00:00:00','Range tra varianti standard e Inserta pubblicate dal rivenditore.'),
('bench_guide_blum_500','tenant_ramirez_atelier','ferramenta','BLUM-GUIDA-500','Guida cassetto Blum 500 mm','Guida a estrazione totale / sistema Blum per cassetto, benchmark di mercato.','coppia','COSTO',14.50,64.41,'Trovaprezzi / Leroy Merlin','https://www.trovaprezzi.it/prezzo_ferramenta_guide_blum_500mm.aspx','2026-08-24 00:00:00','Range molto ampio tra coppie compatibili e guide Blum premium; scegliere il modello reale prima del preventivo definitivo.'),
('bench_manodopera_falegname','tenant_ramirez_atelier','lavorazione','MANODOPERA-FALEGNAME','Manodopera falegname','Tariffa oraria benchmark per lavorazioni di falegnameria.','h','COSTO',35.00,50.00,'Quoto AI','https://quotoai.app/preventivo/falegname','2026-08-24 00:00:00','Benchmark indicativo 2026, non listino ufficiale e non costo aziendale Ramirez Atelier.'),
('bench_verniciatura_poliuretanica','tenant_ramirez_atelier','lavorazione','VERNICIATURA-POLIURETANICA','Verniciatura trasparente poliuretanica legno','Benchmark per ciclo di verniciatura trasparente poliuretanica su legno.','m2','COSTO',15.13,19.14,'Regione Lombardia / Prezzario 2026','https://www.regione.lombardia.it/content/dam/rl/canali-tematici-servizi/09-infrastrutture-trasporti-e-mobilit%C3%A0/01-acquisti-e-contratti-pubblici/02-prezzario-regionale-dei-lavori-pubblici/02-prezzario-regionale-dei-lavori-pubblici-infr/allegati/allegato-2026-unico/allegati-corretti/all-parte-4-elenco-prezzi-precedente-struttura.pdf','2026-08-24 00:00:00','Valore senza spese generali e utile d''impresa: non equivale al costo interno reale.'),
('bench_prezzo_armadio_m2','tenant_ramirez_atelier','mercato','ARMADIO-SU-MISURA-M2','Armadio a muro su misura','Benchmark di prezzo finale al cliente per armadio su misura.','m2','PREZZO_VENDITA',450.00,900.00,'Quoto AI','https://quotoai.app/preventivo/falegname','2026-08-24 00:00:00','Benchmark di mercato IVA esclusa; NON deve essere usato come costo BOM.'),
('bench_prezzo_libreria_m2','tenant_ramirez_atelier','mercato','LIBRERIA-SU-MISURA-M2','Libreria o mobile su misura','Benchmark di prezzo finale al cliente per libreria/mobile su misura.','m2','PREZZO_VENDITA',350.00,700.00,'Quoto AI','https://quotoai.app/preventivo/falegname','2026-08-24 00:00:00','Benchmark di mercato IVA esclusa; NON deve essere usato come costo BOM.'),
('bench_montaggio_cucina_ml','tenant_ramirez_atelier','lavorazione','MONTAGGIO-CUCINA-ML','Montaggio cucina','Benchmark di prezzo per montaggio cucina per metro lineare.','ml','PREZZO_VENDITA',80.00,80.00,'ePreventivo','https://www.epreventivo.it/tempi-di-lavoro-falegname','2026-08-24 00:00:00','Benchmark calcolato su tariffa 40 €/h e tempo indicativo 2 h/ml; non è un costo interno.'),
('bench_prezzo_noce_bussola_m2','tenant_ramirez_atelier','mercato','BUSSOLA-NOCE-PREZZO-M2','Bussola in noce con finitura','Benchmark di prezzo per manufatto in noce con ferramenta e verniciatura, da prezzario regionale.','m2','PREZZO_VENDITA',441.03,475.16,'Prezzario Emilia-Romagna 2026','https://app.computy.ai/prezzario/emilia-romagna/regionale/2026/c/A18','2026-08-24 00:00:00','Voce di prezzario pubblico per bussola, non assimilabile automaticamente a un armadio; usata solo come riferimento di mercato.');
