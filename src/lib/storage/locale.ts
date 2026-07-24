import { mkdir, writeFile } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import type { StorageAdapter, RisultatoUpload } from './tipi';

const CARTELLA_UPLOAD = path.join(process.cwd(), '.uploads-locali');

/**
 * Adattatore che scrive su filesystem locale. Pensato esclusivamente per lo
 * sviluppo su una singola macchina (non adatto a un deployment multi-istanza):
 * evita di dover avere MinIO/S3 in esecuzione solo per lavorare sul wizard.
 * In produzione/staging va sempre usato l'adattatore S3 (v. s3.ts).
 */
export class StorageLocaleAdapter implements StorageAdapter {
  async carica(params: {
    tenantId: string;
    richiestaId: string;
    nomeFileOriginale: string;
    tipoMime: string;
    contenuto: Buffer;
  }): Promise<RisultatoUpload> {
    const cartellaRichiesta = path.join(
      CARTELLA_UPLOAD,
      params.tenantId,
      'richieste',
      params.richiestaId,
    );
    await mkdir(cartellaRichiesta, { recursive: true });

    const estensione = path.extname(params.nomeFileOriginale);
    const nomeUnivoco = `${randomUUID()}${estensione}`;
    const percorsoCompleto = path.join(cartellaRichiesta, nomeUnivoco);

    await writeFile(percorsoCompleto, params.contenuto);

    return {
      storageObjectKey: `locale://${params.tenantId}/richieste/${params.richiestaId}/${nomeUnivoco}`,
      dimensioneByte: params.contenuto.byteLength,
    };
  }
}
