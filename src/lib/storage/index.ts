import type { StorageAdapter } from './tipi';
import { StorageLocaleAdapter } from './locale';

export { determinaCategoria } from './tipi';
export type { StorageAdapter, RisultatoUpload } from './tipi';

let istanza: StorageAdapter | null = null;

/**
 * Se S3_ENDPOINT è configurato, usa S3/MinIO (produzione, staging, o sviluppo con
 * `docker compose up`). Altrimenti ripiega sull'adattatore locale, per poter
 * lavorare sul wizard senza dover avere MinIO in esecuzione.
 */
export function getStorageAdapter(): StorageAdapter {
  if (istanza) return istanza;

  if (process.env.S3_ENDPOINT) {
    // Import dinamico: evita di caricare l'SDK S3 quando non serve (sviluppo locale).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { StorageS3Adapter } = require('./s3');
    istanza = new StorageS3Adapter();
  } else {
    istanza = new StorageLocaleAdapter();
  }

  return istanza as StorageAdapter;
}
