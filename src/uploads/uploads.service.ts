import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { imageSize } from 'image-size';
import { StorageProvider, UploadPublicFileResult } from './storage/storage-provider.interface';
import { STORAGE_PROVIDER } from './storage/storage.tokens';

interface UploadImageForEntityInput {
  entity: string;
  entityId: string;
  file?: {
    buffer: Buffer;
    mimetype: string;
    originalname: string;
    size: number;
  };
}

@Injectable()
export class UploadsService {
  private static readonly MAX_IMAGE_BYTES = 5 * 1024 * 1024;
  private static readonly MAX_IMAGE_WIDTH = 6000;
  private static readonly MAX_IMAGE_HEIGHT = 6000;
  private static readonly ALLOWED_IMAGE_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  constructor(
    @Inject(STORAGE_PROVIDER)
    private readonly storageProvider: StorageProvider,
  ) {}

  async uploadImageForEntity(input: UploadImageForEntityInput): Promise<UploadPublicFileResult> {
    if (!input.file) {
      throw new BadRequestException('Arquivo nao enviado');
    }

    if (!UploadsService.ALLOWED_IMAGE_MIME_TYPES.includes(input.file.mimetype)) {
      throw new BadRequestException('Formato invalido. Use JPG/JPEG, PNG, WEBP ou GIF');
    }

    const mimeFromSignature = this.detectMimeTypeFromSignature(input.file.buffer);
    if (!mimeFromSignature || !UploadsService.ALLOWED_IMAGE_MIME_TYPES.includes(mimeFromSignature)) {
      throw new BadRequestException('Conteudo do arquivo invalido. Envie uma imagem valida.');
    }

    if (mimeFromSignature !== input.file.mimetype) {
      throw new BadRequestException('Mimetype nao corresponde ao conteudo real do arquivo');
    }

    if (input.file.size > UploadsService.MAX_IMAGE_BYTES) {
      throw new BadRequestException('Arquivo excede 5MB');
    }

    this.assertImageDimensions(input.file.buffer);

    const folder = this.buildEntityFolder(input.entity, input.entityId);

    return this.storageProvider.uploadPublicFile({
      buffer: input.file.buffer,
      mimeType: mimeFromSignature,
      originalName: input.file.originalname,
      folder,
    });
  }

  async deleteFileByKey(key?: string | null): Promise<void> {
    if (!key) {
      return;
    }

    await this.storageProvider.deletePublicFile(key);
  }

  private buildEntityFolder(entity: string, entityId: string): string {
    const safeEntity = this.sanitizePathSegment(entity.toLowerCase());
    const safeEntityId = this.sanitizePathSegment(entityId);

    if (!safeEntity || !safeEntityId) {
      throw new BadRequestException('Identificador de pasta invalido para upload');
    }

    return `${safeEntity}/${safeEntityId}`;
  }

  private sanitizePathSegment(segment: string): string {
    return segment
      .replace(/\\/g, '/')
      .split('/')
      .filter((part) => part && part !== '.' && part !== '..')
      .join('-')
      .replace(/[^a-zA-Z0-9_-]/g, '-');
  }

  private detectMimeTypeFromSignature(buffer: Buffer): string | null {
    if (buffer.length < 12) {
      return null;
    }

    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      return 'image/jpeg';
    }

    const pngSignature = '89504e470d0a1a0a';
    if (buffer.subarray(0, 8).toString('hex') === pngSignature) {
      return 'image/png';
    }

    if (buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a') {
      return 'image/gif';
    }

    if (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return 'image/webp';
    }

    return null;
  }

  private assertImageDimensions(buffer: Buffer): void {
    const size = imageSize(buffer);
    const width = size.width;
    const height = size.height;

    if (!width || !height) {
      throw new BadRequestException('Nao foi possivel identificar dimensoes da imagem');
    }

    if (width > UploadsService.MAX_IMAGE_WIDTH || height > UploadsService.MAX_IMAGE_HEIGHT) {
      throw new BadRequestException(
        `Dimensoes invalidas. Maximo permitido: ${UploadsService.MAX_IMAGE_WIDTH}x${UploadsService.MAX_IMAGE_HEIGHT}`,
      );
    }
  }
}
