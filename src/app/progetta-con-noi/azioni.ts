'use server';

import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { db } from '@/server/db';
import { getStorageAdapter, determinaCategoria } from '@/lib/storage';
import { idTenantRamirezAtelier } from '@/server/identity/tenant-corrente';

type EsitoModulo = { successo: true } | { successo: false; errore: string };

const MAX_FILE = 8 * 1024 * 1024;
const MAX_FILES = 5;
const TIPI_AMMESSI = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed',
  'application/acad',
  'application/x-acad',
  'application/autocad_dwg',
  'image/vnd.dwg',
  'application/dxf',
  'image/vnd.dxf',
]);
const ESTENSIONI_AMMESSE = /\.(pdf|jpe?g|png|webp|dwg|dxf|docx|xlsx|zip)$/i;
/** Limite atomico condiviso via PostgreSQL, valido anche tra istanze/serverless. */
async function verificaLimiteInvii(): Promise<boolean> {
  const intestazioni = await headers();
  const ip =
    intestazioni.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() ||
    intestazioni.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    'ip-non-disponibile';
  const chiave = createHash('sha256').update(ip).digest('hex');
  const risultato = await db.$queryRaw<Array<{ conteggio: number }>>`
    INSERT INTO "limite_invio_pubblico" ("chiaveHash", "finestraIniziata", "conteggio", "aggiornatoIl")
    VALUES (${chiave}, CURRENT_TIMESTAMP, 1, CURRENT_TIMESTAMP)
    ON CONFLICT ("chiaveHash") DO UPDATE SET
      "finestraIniziata" = CASE
        WHEN "limite_invio_pubblico"."finestraIniziata" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
          THEN CURRENT_TIMESTAMP
        ELSE "limite_invio_pubblico"."finestraIniziata"
      END,
      "conteggio" = CASE
        WHEN "limite_invio_pubblico"."finestraIniziata" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
          THEN 1
        ELSE "limite_invio_pubblico"."conteggio" + 1
      END,
      "aggiornatoIl" = CURRENT_TIMESTAMP
    WHERE "limite_invio_pubblico"."finestraIniziata" <= CURRENT_TIMESTAMP - INTERVAL '15 minutes'
       OR "limite_invio_pubblico"."conteggio" < 5
    RETURNING "conteggio"
  `;
  return risultato.length > 0;
}

export async function inviaRichiestaProgettoPubblica(
  _statoPrecedente: EsitoModulo | null,
  formData: FormData,
): Promise<EsitoModulo> {
  let richiestaId: string | null = null;
  const chiaviCaricate: string[] = [];
  let storage: ReturnType<typeof getStorageAdapter> | null = null;
  try {
    // Campo honeypot: bot comuni vengono fermati senza creare richieste.
    if (String(formData.get('aziendaSito') ?? '').trim()) return { successo: true };

    const nome = String(formData.get('nome') ?? '').trim();
    const email = String(formData.get('email') ?? '')
      .trim()
      .toLowerCase();
    const telefono = String(formData.get('telefono') ?? '').trim();
    const tipoProgetto = String(formData.get('tipoProgetto') ?? '').trim();
    const messaggio = String(formData.get('messaggio') ?? '').trim();
    const privacy = formData.get('privacy') === 'on';

    if (nome.length < 2 || nome.length > 120) {
      return { successo: false, errore: 'Inserisci nome e cognome.' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 180) {
      return { successo: false, errore: 'Controlla l’indirizzo email inserito.' };
    }
    if (telefono.length > 40) {
      return { successo: false, errore: 'Il numero di telefono è troppo lungo.' };
    }
    if (!['parete-attrezzata', 'libreria', 'boiserie', 'madia', 'altro'].includes(tipoProgetto)) {
      return { successo: false, errore: 'Seleziona una tipologia di progetto.' };
    }
    if (messaggio.length < 10 || messaggio.length > 4000) {
      return {
        successo: false,
        errore: 'La descrizione deve contenere da 10 a 4000 caratteri.',
      };
    }
    if (!privacy) {
      return {
        successo: false,
        errore: 'Per inviare la richiesta devi confermare di aver letto l’informativa privacy.',
      };
    }
    if (!(await verificaLimiteInvii())) {
      return { successo: false, errore: 'Hai effettuato troppi tentativi. Riprova tra 15 minuti.' };
    }

    const files = formData
      .getAll('documenti')
      .filter((value): value is File => value instanceof File && value.size > 0);
    if (files.length > MAX_FILES) {
      return { successo: false, errore: 'Puoi allegare al massimo 5 file.' };
    }
    for (const file of files) {
      if (file.size > MAX_FILE) {
        return { successo: false, errore: 'Ogni allegato deve essere inferiore a 8 MB.' };
      }
      if (!ESTENSIONI_AMMESSE.test(file.name)) {
        return { successo: false, errore: 'Uno degli allegati ha un formato non supportato.' };
      }
      if (file.type && !TIPI_AMMESSI.has(file.type)) {
        return { successo: false, errore: 'Il tipo di file dichiarato non è supportato.' };
      }
    }

    const tenantId = await idTenantRamirezAtelier();
    // Collega la richiesta alla categoria amministrativa più pertinente:
    // zona giorno per pareti attrezzate, librerie e madie; falegnameria su misura
    // per boiserie e richieste generiche.
    const chiaveTipoAmministrativo = ['parete-attrezzata', 'libreria', 'madia'].includes(
      tipoProgetto,
    )
      ? 'zona-giorno'
      : 'falegnameria-su-misura';
    const tipoDisponibile = await db.tipoProgetto.findFirst({
      where: { tenantId, attivo: true, chiave: chiaveTipoAmministrativo },
    });
    if (!tipoDisponibile) {
      return {
        successo: false,
        errore:
          'Il servizio richieste non è ancora disponibile. Contattaci tramite i recapiti del sito.',
      };
    }

    const richiesta = await db.richiestaProgetto.create({
      data: {
        tenantId,
        tipoProgettoId: tipoDisponibile.id,
        clienteNome: nome,
        clienteEmail: email,
        clienteTelefono: telefono || null,
        messaggioLibero: messaggio,
        datiFormJson: { canale: 'progetta-con-noi', tipologiaRichiesta: tipoProgetto },
        stato: 'NUOVA',
      },
    });

    richiestaId = richiesta.id;

    await db.eventoAttivita.create({
      data: {
        richiestaId: richiesta.id,
        tipo: 'RICHIESTA_CREATA',
        descrizione: 'Richiesta pubblica ricevuta dalla pagina Progetta con noi',
        metadatiJson: {
          tipologiaRichiesta: tipoProgetto,
          numeroAllegati: files.length,
          consensoPrivacy: true,
        },
        attore: 'CLIENTE',
      },
    });

    storage = getStorageAdapter();
    for (const file of files) {
      const contenuto = Buffer.from(await file.arrayBuffer());
      const { storageObjectKey, dimensioneByte } = await storage.carica({
        tenantId,
        richiestaId: richiesta.id,
        nomeFileOriginale: file.name,
        tipoMime: file.type || 'application/octet-stream',
        contenuto,
      });
      chiaviCaricate.push(storageObjectKey);
      await db.documentoRichiesta.create({
        data: {
          richiestaId: richiesta.id,
          nomeFileOriginale: file.name,
          tipoMime: file.type || 'application/octet-stream',
          categoria: determinaCategoria(file.type, file.name),
          storageObjectKey,
          dimensioneByte,
        },
      });
      await db.eventoAttivita.create({
        data: {
          richiestaId: richiesta.id,
          tipo: 'DOCUMENTO_CARICATO',
          descrizione: 'Allegato ricevuto con la richiesta pubblica',
          metadatiJson: { nomeFile: file.name, dimensioneByte },
          attore: 'CLIENTE',
        },
      });
    }

    // Non dichiarare inviata una email: il provider configurato nel progetto al momento
    // registra su console. La richiesta resta disponibile nell'area amministrativa.
    return { successo: true };
  } catch {
    // Compensa gli upload e i record già creati se un allegato o un evento fallisce.
    if (storage && chiaviCaricate.length) {
      await Promise.allSettled(chiaviCaricate.map((chiave) => storage!.elimina(chiave)));
    }
    if (richiestaId) {
      try {
        await db.richiestaProgetto.delete({ where: { id: richiestaId } });
      } catch {
        // Se la compensazione DB fallisce, non mascheriamo l'errore originario.
      }
    }
    return {
      successo: false,
      errore:
        'Non siamo riusciti a inviare la richiesta. Riprova tra poco oppure contattaci tramite il sito.',
    };
  }
}
