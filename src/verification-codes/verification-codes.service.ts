import { Injectable } from '@nestjs/common';
import { createHash, randomInt } from 'node:crypto';

export interface GeneratedVerificationCode {
  code: string;
  codeHash: string;
  expiresAt: Date;
}

@Injectable()
export class VerificationCodesService {
  generateCode(expiresInHours: number): GeneratedVerificationCode {
    const code = randomInt(100000, 1000000).toString();

    return {
      code,
      codeHash: this.hashCode(code),
      expiresAt: this.buildExpirationDate(expiresInHours),
    };
  }

  hashCode(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }

  isCodeValid(params: {
    providedCode: string;
    expectedCodeHash: string;
    expiresAt: Date;
  }): boolean {
    if (params.expiresAt.getTime() < Date.now()) {
      return false;
    }

    return this.hashCode(params.providedCode) === params.expectedCodeHash;
  }

  buildExpirationDate(expiresInHours: number): Date {
    return new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  }
}
