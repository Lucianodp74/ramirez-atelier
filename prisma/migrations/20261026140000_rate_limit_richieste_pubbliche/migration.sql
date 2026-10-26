CREATE TABLE "limite_invio_pubblico" (
    "chiaveHash" TEXT NOT NULL,
    "finestraIniziata" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conteggio" INTEGER NOT NULL DEFAULT 1,
    "aggiornatoIl" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "limite_invio_pubblico_pkey" PRIMARY KEY ("chiaveHash")
);
