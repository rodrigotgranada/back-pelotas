export interface UploadPublicFileInput {
  buffer: Buffer;
  mimeType: string;
  originalName: string;
  folder: string;
}

export interface UploadPublicFileResult {
  key: string;
  url: string;
  size: number;
  contentType: string;
}

export interface StorageProvider {
  uploadPublicFile(input: UploadPublicFileInput): Promise<UploadPublicFileResult>;
  deletePublicFile(key: string): Promise<void>;
}
