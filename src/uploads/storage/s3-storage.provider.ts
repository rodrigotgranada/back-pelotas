import { randomUUID } from 'crypto';
import { extname } from 'path';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { StorageProvider, UploadPublicFileInput, UploadPublicFileResult } from './storage-provider.interface';

interface S3StorageProviderOptions {
  bucketName: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicBaseUrl?: string;
  forcePathStyle?: boolean;
}

export class S3StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucketName: string;
  private readonly region: string;
  private readonly publicBaseUrl?: string;

  constructor(private readonly options: S3StorageProviderOptions) {
    if (!options.bucketName) {
      throw new Error('S3_BUCKET_NAME nao configurado');
    }

    if (!options.region) {
      throw new Error('S3_REGION nao configurado');
    }

    if (!options.accessKeyId || !options.secretAccessKey) {
      throw new Error('S3_ACCESS_KEY_ID ou S3_SECRET_ACCESS_KEY nao configurado');
    }

    this.bucketName = options.bucketName;
    this.region = options.region;
    this.publicBaseUrl = options.publicBaseUrl?.replace(/\/$/, '');

    this.client = new S3Client({
      region: options.region,
      endpoint: options.endpoint,
      forcePathStyle: options.forcePathStyle ?? Boolean(options.endpoint),
      credentials: {
        accessKeyId: options.accessKeyId,
        secretAccessKey: options.secretAccessKey,
      },
    });
  }

  async uploadPublicFile(input: UploadPublicFileInput): Promise<UploadPublicFileResult> {
    const safeFolder = this.normalizeSegment(input.folder);
    const extension = this.resolveExtension(input.originalName, input.mimeType);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const key = `${safeFolder}/${fileName}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
      }),
    );

    return {
      key,
      url: this.buildPublicUrl(key),
      size: input.buffer.length,
      contentType: input.mimeType,
    };
  }

  async deletePublicFile(key: string): Promise<void> {
    const safeKey = this.normalizeSegment(key);

    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: safeKey,
        }),
      );
    } catch {
      // Best-effort cleanup. Provider errors on delete should not break user flow.
    }
  }

  private buildPublicUrl(key: string): string {
    const encodedKey = key
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');

    if (this.publicBaseUrl) {
      return `${this.publicBaseUrl}/${encodedKey}`;
    }

    return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${encodedKey}`;
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
