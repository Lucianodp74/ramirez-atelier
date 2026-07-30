// Script one-off: aggiunge `immagine` alle opzioni del campo "Tipo di elemento"
// dentro TipoProgetto "zona-giorno" (chiave `tipoElemento`, step `tipo_elemento`).
//
// DRY-RUN DI DEFAULT: stampa solo cosa cambierebbe, non scrive nulla.
// Per scrivere davvero su Supabase, aggiungi --apply:
//
//   npx tsx --env-file=.env scripts/aggiorna-immagini-zona-giorno.ts
//   npx tsx --env-file=.env scripts/aggiorna-immagini-zona-giorno.ts --apply

import { db } from '../src/server/db'

const CHIAVE_TIPO_PROGETTO = 'zona-giorno'
const CHIAVE_STEP = 'tipo_elemento'
const CHIAVE_CAMPO = 'tipoElemento'

// Mappa valore opzione -> path immagine in /public (verificati contro i file
// effettivamente presenti dopo l'ottimizzazione: max 2000px, JPEG q82, <1MB).
const IMMAGINI: Record<string, string> = {
  libreria: '/foto-elemento-libreria.jpg',
  parete_attrezzata: '/foto-elemento-parete-attrezzata.jpg',
  mobile_tv: '/foto-elemento-mobile-tv.jpg',
  credenza: '/foto-elemento-credenza.jpg',
  altro: '/foto-elemento-altro-zona-giorno.jpg',
}

type Opzione = { valore: string; etichetta: string; immagine?: string }
type Campo = { chiave: string; opzioni?: Opzione[]; [k: string]: unknown }
type Step = { chiave: string; campi: Campo[]; [k: string]: unknown }
type Configurazione = { step: Step[] }

async function main() {
  const applica = process.argv.includes('--apply')

  // La chiave non è @unique da sola nello schema (lo è [tenantId, chiave]),
  // quindi cerchiamo con findFirst - coerente con l'id già noto dall'ispezione
  // precedente (tenant Ramirez Atelier è comunque l'unico oggi).
  const tipoProgetto = await db.tipoProgetto.findFirst({
    where: { chiave: CHIAVE_TIPO_PROGETTO },
  })

  if (!tipoProgetto) {
    console.error(`Nessun TipoProgetto trovato con chiave "${CHIAVE_TIPO_PROGETTO}".`)
    process.exit(1)
  }

  const config = tipoProgetto.configurazione as unknown as Configurazione

  const step = config.step.find((s) => s.chiave === CHIAVE_STEP)
  if (!step) {
    console.error(`Step "${CHIAVE_STEP}" non trovato dentro configurazione.`)
    process.exit(1)
  }

  const campo = step.campi.find((c) => c.chiave === CHIAVE_CAMPO)
  if (!campo || !campo.opzioni) {
    console.error(`Campo "${CHIAVE_CAMPO}" (con opzioni) non trovato dentro lo step "${CHIAVE_STEP}".`)
    process.exit(1)
  }

  console.log(`TipoProgetto: ${tipoProgetto.nome} (id: ${tipoProgetto.id})`)
  console.log(`Modalità: ${applica ? 'APPLICA (scriverà su Supabase)' : 'DRY-RUN (nessuna scrittura)'}`)
  console.log('')

  let modificati = 0
  for (const opzione of campo.opzioni) {
    const nuovaImmagine = IMMAGINI[opzione.valore]
    if (!nuovaImmagine) {
      console.log(`  [invariato] "${opzione.valore}" — nessuna immagine mappata per questo valore.`)
      continue
    }
    if (opzione.immagine === nuovaImmagine) {
      console.log(`  [già a posto] "${opzione.valore}" -> ${nuovaImmagine}`)
      continue
    }
    console.log(`  [${applica ? 'scrivo' : 'scriverei'}] "${opzione.valore}": ${opzione.immagine ?? '(assente)'} -> ${nuovaImmagine}`)
    opzione.immagine = nuovaImmagine
    modificati++
  }

  console.log('')
  if (modificati === 0) {
    console.log('Nessuna modifica necessaria.')
    process.exit(0)
  }

  if (!applica) {
    console.log(`${modificati} opzione/i verrebbero aggiornate. Rilancia con --apply per scrivere davvero.`)
    process.exit(0)
  }

  await db.tipoProgetto.update({
    where: { id: tipoProgetto.id },
    data: { configurazione: config as any },
  })

  console.log(`Fatto. ${modificati} opzione/i aggiornate su Supabase.`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exitCode = 1
  })
  .finally(() => {
    process.exit(process.exitCode ?? 0)
  })
