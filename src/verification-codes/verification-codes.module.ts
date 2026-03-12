import { Module } from '@nestjs/common';
import { VerificationCodesService } from './verification-codes.service';

@Module({
  providers: [VerificationCodesService],
  exports: [VerificationCodesService],
})
export class VerificationCodesModule {}
