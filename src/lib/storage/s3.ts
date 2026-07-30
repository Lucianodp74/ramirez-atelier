import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import path from 'path';
import type { StorageAdapter, RisultatoUpload, RisultatoDownload } from './tipi';

export class StorageS3Adapter implements StorageAdapter {
  private client: S3Client;
  private bucket: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT;
    const accessKeyId = process.env.S3_ACCESS_KEY;
    const secretAccessKey = process.env.S3_SECRET_KEY;
    this.bucket = process.env.S3_BUCKET ?? 'uploads';

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "StorageS3Adapter richiede S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY nelle variabili d'ambiente.",
      );
    }

    this.client = new S3Client({
      endpoint,
      region: process.env.S3_REGION ?? 'auto', // R2 raccomanda esplicitamente "auto"; MinIO ignora il valore
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true, // necessario per MinIO; R2 supporta comunque questo stile
    });
  }

  async carica(params: {
    tenantId: string;
    richiestaId: string;
    nomeFileOriginale: string;
    tipoMime: string;
    contenuto: Buffer;
  }): Promise<RisultatoUpload> {
    const estensione = path.extname(params.nomeFileOriginale);
    const key = `${params.tenantId}/richieste/${params.richiestaId}/${randomUUID()}${estensione}`;
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: params.contenuto,
        ContentType: params.tipoMime,
      }),
    );
    return {
      storageObjectKey: key,
      dimensioneByte: params.contenuto.byteLength,
    };
  }

  async scarica(storageObjectKey: string): Promise<RisultatoDownload> {
    const comando = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageObjectKey,
    });
    // URL firmato valido 5 minuti - tempo ampio per avviare il download,
    // abbastanza breve da non lasciare link condivisibili a lungo termine
    // per documenti privati dei clienti.
    const url = await getSignedUrl(this.client, comando, { expiresIn: 300 });
    return { tipo: 'redirect', url };
  }
}
