import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from './notification-channel.interface';
import { SendVerificationCodeInput } from '../notification.types';

@Injectable()
export class SmsNotificationChannel implements NotificationChannel {
  readonly type = 'sms' as const;
  private readonly logger = new Logger(SmsNotificationChannel.name);

  async sendVerificationCode(input: SendVerificationCodeInput): Promise<void> {
    this.logger.log(
      `[sms] purpose=${input.purpose} recipient=${input.recipient} code=${input.code} validForHours=${input.expiresInHours} (stub)`,
    );
  }
}
