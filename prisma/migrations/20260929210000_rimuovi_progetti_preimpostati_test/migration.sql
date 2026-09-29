-- Pulizia dei tre progetti preimpostati creati esclusivamente per il collaudo V1.
-- Non modifica il catalogo reale né i moduli del Preventivatore.
-- I nomi/categorie sono volutamente specifici per evitare una cancellazione generica.
DELETE FROM "progetto_preimpostato"
WHERE ("nome" = 'Test Base 105' AND "categoria" = 'armadio')
   OR ("nome" = 'Test base 105' AND "categoria" = 'Test')
   OR ("nome" = 'Mobile basso test' AND "categoria" = 'LIVING');
