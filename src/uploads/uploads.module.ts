import { Module } from '@nestjs/common';
import { storageProviderFactory } from './storage/storage.provider';
import { STORAGE_PROVIDER } from './storage/storage.tokens';
import { UploadsService } from './uploads.service';

@Module({
  providers: [storageProviderFactory, UploadsService],
  exports: [STORAGE_PROVIDER, UploadsService],
})
export class UploadsModule {}
