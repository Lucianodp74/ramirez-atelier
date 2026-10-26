'use server';

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

export async function inviaRichiestaProgettoPubblica(
  _statoPrecedente: EsitoModulo | null,
  formData: FormData,
): Promise<EsitoModulo> {
  try {
    // Campo honeypot: bot comuni vengono fermati senza creare richieste.
    if (String(formData.get('aziendaSito') ?? '').trim()) return { successo: true };

    const nome = String(formData.get('nome') ?? '').trim();
    const email = String(formData.get('email') ?? '').trim().toLowerCase();
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
    const tipoDisponibile = await db.tipoProgetto.findFirst({
      where: { tenantId, attivo: true },
      orderBy: { ordinamento: 'asc' },
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

    const storage = getStorageAdapter();
    for (const file of files) {
      const contenuto = Buffer.from(await file.arrayBuffer());
      const { storageObjectKey, dimensioneByte } = await storage.carica({
        tenantId,
        richiestaId: richiesta.id,
        nomeFileOriginale: file.name,
        tipoMime: file.type || 'application/octet-stream',
        contenuto,
      });
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
    return {
      successo: false,
      errore:
        'Non siamo riusciti a inviare la richiesta. Riprova tra poco oppure contattaci tramite il sito.',
    };
  }
}
