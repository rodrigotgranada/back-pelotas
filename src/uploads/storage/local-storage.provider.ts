import { randomUUID } from 'crypto';
import { mkdir, rm, writeFile } from 'fs/promises';
import { extname, join } from 'path';
import { StorageProvider, UploadPublicFileInput, UploadPublicFileResult } from './storage-provider.interface';

interface LocalStorageProviderOptions {
  rootPath: string;
  publicBaseUrl: string;
}

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly options: LocalStorageProviderOptions) {}

  async uploadPublicFile(input: UploadPublicFileInput): Promise<UploadPublicFileResult> {
    const safeFolder = this.normalizeSegment(input.folder);
    const extension = this.resolveExtension(input.originalName, input.mimeType);
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const key = `${safeFolder}/${fileName}`;
    const targetDirectory = join(process.cwd(), this.options.rootPath, safeFolder);
    const targetFilePath = join(targetDirectory, fileName);

    await mkdir(targetDirectory, { recursive: true });
    await writeFile(targetFilePath, input.buffer);

    return {
      key,
      url: `${this.options.publicBaseUrl}/${this.options.rootPath}/${key}`,
      size: input.buffer.length,
      contentType: input.mimeType,
    };
  }

  async deletePublicFile(key: string): Promise<void> {
    const safeKey = this.normalizeSegment(key);
    const filePath = join(process.cwd(), this.options.rootPath, safeKey);

    try {
      await rm(filePath, { force: true });
    } catch {
      // Best-effort cleanup. Missing files should not break user flow.
    }
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
