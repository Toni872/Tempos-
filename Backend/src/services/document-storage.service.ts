import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

type StorageDriver = 'local' | 'gcs';

export type UploadInput = {
  filename: string;
  mimeType: string;
  content: Buffer;
  userId: string;
};

export type UploadResult = {
  filename: string;
  fileUrl: string;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, '../../uploads');
const driverFromEnv = String(process.env.DOCUMENTS_STORAGE_DRIVER || '').toLowerCase();
const bucketName = process.env.GCS_BUCKET;

function resolveDriver(): StorageDriver {
  if (driverFromEnv === 'gcs') return 'gcs';
  if (driverFromEnv === 'local') return 'local';
  return bucketName ? 'gcs' : 'local';
}

function ensureLocalDir(): void {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function makeSafeFilename(original: string): string {
  return original.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildGcsObjectPath(userId: string, filename: string): string {
  return `documents/${userId}/${Date.now()}_${makeSafeFilename(filename)}`;
}

export class DocumentStorageService {
  private readonly driver: StorageDriver;
  private readonly storage: Storage | null;

  constructor() {
    this.driver = resolveDriver();
    this.storage = this.driver === 'gcs' ? new Storage() : null;
    if (this.driver === 'local') {
      ensureLocalDir();
    }
  }

  async save(input: UploadInput): Promise<UploadResult> {
    const safeName = makeSafeFilename(input.filename || 'documento.bin');

    if (this.driver === 'gcs') {
      if (!bucketName || !this.storage) {
        throw new Error('GCS_BUCKET no definido para almacenamiento en GCS');
      }

      const objectPath = buildGcsObjectPath(input.userId, safeName);
      const bucket = this.storage.bucket(bucketName);
      const gcsFile = bucket.file(objectPath);

      await gcsFile.save(input.content, {
        resumable: false,
        contentType: input.mimeType || 'application/octet-stream',
        metadata: {
          cacheControl: 'private, max-age=0, no-store',
        },
      });

      return {
        filename: safeName,
        fileUrl: `gs://${bucketName}/${objectPath}`,
      };
    }

    const localFilename = `${Date.now()}_${safeName}`;
    const localPath = path.join(UPLOADS_DIR, localFilename);
    await fs.promises.writeFile(localPath, input.content);

    return {
      filename: localFilename,
      fileUrl: localPath,
    };
  }

  async openReadStream(fileUrl: string): Promise<NodeJS.ReadableStream | null> {
    if (!fileUrl) {
      return null;
    }

    if (fileUrl.startsWith('gs://')) {
      if (!this.storage) {
        return null;
      }

      const parsed = this.parseGcsUrl(fileUrl);
      if (!parsed) {
        return null;
      }

      const [bucket, objectPath] = parsed;
      const gcsFile = this.storage.bucket(bucket).file(objectPath);
      const [exists] = await gcsFile.exists();
      if (!exists) {
        return null;
      }
      return gcsFile.createReadStream();
    }

    if (!fs.existsSync(fileUrl)) {
      return null;
    }

    return fs.createReadStream(fileUrl);
  }

  private parseGcsUrl(fileUrl: string): [string, string] | null {
    const withoutScheme = fileUrl.replace('gs://', '');
    const slashIndex = withoutScheme.indexOf('/');
    if (slashIndex <= 0) {
      return null;
    }

    const bucket = withoutScheme.slice(0, slashIndex);
    const objectPath = withoutScheme.slice(slashIndex + 1);
    if (!bucket || !objectPath) {
      return null;
    }

    return [bucket, objectPath];
  }
}

export const documentStorageService = new DocumentStorageService();
