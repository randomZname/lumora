import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Storage abstraction (contract 2.2).
 * Dev default = LocalDiskStorage (writes to public/uploads).
 * Prod = S3-compatible (MinIO / Cloudflare R2) via env, gated by STORAGE_DRIVER=s3.
 */

export interface StoredObject {
  url: string;
  key: string;
}

export interface StorageProvider {
  /** uploads bytes, returns a publicly-readable URL + storage key */
  upload(buffer: Buffer, key: string, contentType: string): Promise<StoredObject>;
}

/**
 * LocalDiskStorage — writes to public/uploads and serves at /uploads/<key>.
 * Fully working with only Node fs; no external SDK required.
 */
export class LocalDiskStorage implements StorageProvider {
  private readonly baseDir: string;

  constructor(baseDir?: string) {
    // Written to <cwd>/media and served by /api/media/[...path].
    // (public/ is NOT used: `next start` won't serve files added after build.)
    this.baseDir = baseDir ?? path.join(process.cwd(), 'media');
  }

  async upload(buffer: Buffer, key: string, _contentType: string): Promise<StoredObject> {
    // Normalize key to a safe relative path (no leading slash, no traversal).
    const safeKey = key.replace(/^\/+/, '').replace(/\.\.(\/|\\|$)/g, '');
    const destPath = path.join(this.baseDir, safeKey);

    await mkdir(path.dirname(destPath), { recursive: true });
    await writeFile(destPath, buffer);

    return {
      url: `/api/media/${safeKey.split(path.sep).join('/')}`,
      key: safeKey,
    };
  }
}

/**
 * S3Storage — S3-compatible (MinIO dev / R2 prod) placeholder.
 * Gated by STORAGE_DRIVER=s3. Requires env:
 *   STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY
 *
 * NOTE: requires @aws-sdk/client-s3 (not installed yet — do NOT install here).
 */
export class S3Storage implements StorageProvider {
  private readonly endpoint: string;
  private readonly bucket: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly region: string;

  constructor() {
    const endpoint = process.env.STORAGE_ENDPOINT;
    const bucket = process.env.STORAGE_BUCKET;
    const accessKey = process.env.STORAGE_ACCESS_KEY;
    const secretKey = process.env.STORAGE_SECRET_KEY;

    if (!endpoint || !bucket || !accessKey || !secretKey) {
      throw new Error(
        'S3Storage requires STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY and STORAGE_SECRET_KEY',
      );
    }

    this.endpoint = endpoint;
    this.bucket = bucket;
    this.accessKey = accessKey;
    this.secretKey = secretKey;
    this.region = process.env.STORAGE_REGION ?? 'us-east-1';
  }

  async upload(buffer: Buffer, key: string, contentType: string): Promise<StoredObject> {
    // NOTE: requires @aws-sdk/client-s3 — dynamic import so the package is only
    // needed when STORAGE_DRIVER=s3 is actually used.
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const client = new S3Client({
      endpoint: this.endpoint,
      region: this.region,
      forcePathStyle: true, // required for MinIO
      credentials: {
        accessKeyId: this.accessKey,
        secretAccessKey: this.secretKey,
      },
    });

    const safeKey = key.replace(/^\/+/, '');

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: safeKey,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    const base = this.endpoint.replace(/\/+$/, '');
    return {
      url: `${base}/${this.bucket}/${safeKey}`,
      key: safeKey,
    };
  }
}

/** Picks the storage implementation from env (default: local disk). */
export function getStorage(): StorageProvider {
  const driver = (process.env.STORAGE_DRIVER ?? 'local').toLowerCase();

  switch (driver) {
    case 's3':
    case 'minio':
      return new S3Storage();
    case 'local':
    default:
      return new LocalDiskStorage();
  }
}
