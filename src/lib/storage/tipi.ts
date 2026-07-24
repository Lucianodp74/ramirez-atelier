import type { CategoriaDocumento } from '@prisma/client';

export interface RisultatoUpload {
  storageObjectKey: string;
  dimensioneByte: number;
}

/**
 * Interfaccia comune tra l'adattatore locale (sviluppo, senza dipendenze esterne)
 * e l'adattatore S3 (MinIO in locale via Docker, provider reale in produzione).
 * Il resto dell'applicazione dipende solo da questa interfaccia, mai dai dettagli
 * implementativi di uno dei due adattatori — coerente con la disciplina di
 * Document Management già stabilita nel Database Design di ArtigianOS (il
 * contenuto binario non vive mai nel database, solo il riferimento).
 */
export interface StorageAdapter {
  carica(params: {
    tenantId: string;
    richiestaId: string;
    nomeFileOriginale: string;
    tipoMime: string;
    contenuto: Buffer;
  }): Promise<RisultatoUpload>;
}

const CATEGORIE_PER_MIME: Array<{
  predicato: (mime: string, nome: string) => boolean;
  categoria: CategoriaDocumento;
}> = [
  { predicato: (mime) => mime.startsWith('image/') && !mime.includes('svg'), categoria: 'FOTO' },
  { predicato: (mime) => mime === 'application/pdf', categoria: 'PDF' },
  {
    predicato: (_mime, nome) => /\.(dwg|dxf)$/i.test(nome),
    categoria: 'DWG_DXF',
  },
  {
    predicato: (_mime, nome) => /\.(skp|3ds|obj|fbx)$/i.test(nome) || /render/i.test(nome),
    categoria: 'RENDER',
  },
  { predicato: (mime) => mime.startsWith('video/'), categoria: 'VIDEO' },
];

/**
 * Determina la categoria del documento dal tipo MIME e/o dal nome file.
 * Nessuna analisi del contenuto: è una classificazione euristica sui metadati,
 * coerente con la regola esplicita "l'analisi del contenuto arriva in una fase
 * successiva" (Requisito 4).
 */
export function determinaCategoria(tipoMime: string, nomeFile: string): CategoriaDocumento {
  const regola = CATEGORIE_PER_MIME.find((r) => r.predicato(tipoMime, nomeFile));
  return regola?.categoria ?? 'ALTRO';
}
