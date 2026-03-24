import { randomUUID } from 'crypto';
import { extname } from 'path';
import { Storage } from '@google-cloud/storage';
import { StorageProvider, UploadPublicFileInput, UploadPublicFileResult } from './storage-provider.interface';

interface FirebaseStorageProviderOptions {
  bucketName: string;
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  serviceAccountJson?: string;
}

export class FirebaseStorageProvider implements StorageProvider {
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(private readonly options: FirebaseStorageProviderOptions) {
    this.bucketName = options.bucketName;

    if (!this.bucketName) {
      throw new Error('FIREBASE_STORAGE_BUCKET nao configurado');
    }

    this.storage = this.buildStorageClient(options);
  }

  async uploadPublicFile(input: UploadPublicFileInput): Promise<UploadPublicFileResult> {
    const safeFolder = this.normalizeSegment(input.folder);
    const extension = this.resolveExtension(input.originalName, input.mimeType);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const key = `${safeFolder}/${fileName}`;
    const downloadToken = randomUUID();
    const file = this.storage.bucket(this.bucketName).file(key);

    try {
      await file.save(input.buffer, {
        contentType: input.mimeType,
        resumable: false,
        validation: false, // Optional: skips local hash validation
        metadata: {
          contentType: input.mimeType,
          metadata: {
            firebaseStorageDownloadTokens: downloadToken,
          },
        },
      });
    } catch (err: any) {
      const message = err?.message ?? String(err);
      throw new Error(`Firebase Storage upload failed: ${message}`);
    }

    const encodedKey = encodeURIComponent(key);
    const url = `https://firebasestorage.googleapis.com/v0/b/${this.bucketName}/o/${encodedKey}?alt=media&token=${downloadToken}`;

    return {
      key,
      url,
      size: input.buffer.length,
      contentType: input.mimeType,
    };
  }

  async deletePublicFile(key: string): Promise<void> {
    const safeKey = this.normalizeSegment(key);

    try {
      await this.storage.bucket(this.bucketName).file(safeKey).delete({ ignoreNotFound: true });
    } catch {
      // Best-effort cleanup. Provider errors on delete should not break user flow.
    }
  }

  private buildStorageClient(options: FirebaseStorageProviderOptions): Storage {
    if (options.serviceAccountJson) {
      const parsed = JSON.parse(options.serviceAccountJson) as {
        project_id?: string;
      };

      return new Storage({
        projectId: options.projectId ?? parsed.project_id,
        credentials: JSON.parse(options.serviceAccountJson),
      });
    }

    if (options.clientEmail && options.privateKey) {
      return new Storage({
        projectId: options.projectId,
        credentials: {
          client_email: options.clientEmail,
          private_key: options.privateKey,
        },
      });
    }

    return new Storage({
      projectId: options.projectId,
    });
  }

  private resolveExtension(originalName: string, mimeType: string): string {
    const fromName = extname(originalName).trim().toLowerCase();
    if (fromName) {
      return fromName;
    }

    const mimeToExt: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    };

    return mimeToExt[mimeType] ?? '.bin';
  }

  private normalizeSegment(value: string): string {
    return value
      .replace(/\\/g, '/')
      .split('/')
      .filter((segment) => segment && segment !== '.' && segment !== '..')
      .join('/');
  }
}
