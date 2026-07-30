// Script one-off DI SOLA LETTURA — nessuna scrittura sul database.
// Obiettivo: vedere la forma reale di TipoProgetto.configurazione per la
// categoria "Zona Giorno" (chiave probabile: "zona-giorno" o "living"),
// prima di scrivere qualunque script di aggiornamento.
//
// Riusa l'istanza Prisma condivisa del progetto (src/server/db.ts), con lo
// stesso driver adapter e la stessa DATABASE_URL già in uso dall'app -
// nessuna seconda connessione scollegata.
//
// Uso (dalla root del progetto):
//   npx tsx --env-file=.env scripts/ispeziona-tipo-progetto.ts
// (--env-file carica DATABASE_URL/DIRECT_URL dal tuo .env - necessario
// perché uno script standalone, a differenza di Next.js, non lo fa da solo)

import { db } from '../src/server/db'

async function main() {
  // Cerca per possibili chiavi note, senza assumere quale sia quella giusta.
  const candidati = await db.tipoProgetto.findMany({
    where: {
      OR: [
        { chiave: 'zona-giorno' },
        { chiave: 'living' },
        { nome: { contains: 'Zona Giorno' } },
        { nome: { contains: 'Living' } },
      ],
    },
    select: {
      id: true,
      tenantId: true,
      chiave: true,
      nome: true,
      configurazione: true,
    },
  })

  if (candidati.length === 0) {
    console.log('Nessun TipoProgetto trovato con chiave/nome simile a "Zona Giorno" o "Living".')
    console.log('Elenco di TUTTI i TipoProgetto esistenti, per verificare la chiave corretta:')
    const tutti = await db.tipoProgetto.findMany({
      select: { id: true, chiave: true, nome: true, tenantId: true },
    })
    console.log(JSON.stringify(tutti, null, 2))
    return
  }

  for (const t of candidati) {
    console.log('='.repeat(80))
    console.log(`id: ${t.id}`)
    console.log(`tenantId: ${t.tenantId}`)
    console.log(`chiave: ${t.chiave}`)
    console.log(`nome: ${t.nome}`)
    console.log('configurazione:')
    console.log(JSON.stringify(t.configurazione, null, 2))
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0)
  })
