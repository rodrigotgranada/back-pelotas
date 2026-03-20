import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from './notification-channel.interface';
import { SendVerificationCodeInput, SendWelcomeEmailInput } from '../notification.types';

@Injectable()
export class WhatsappNotificationChannel implements NotificationChannel {
  readonly type = 'whatsapp' as const;
  private readonly logger = new Logger(WhatsappNotificationChannel.name);

  async sendVerificationCode(input: SendVerificationCodeInput): Promise<void> {
    this.logger.log(
      `[whatsapp] purpose=${input.purpose} recipient=${input.recipient} code=${input.code} validForHours=${input.expiresInHours} (stub)`,
    );
  }

  async sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void> {
    this.logger.log(`[whatsapp] purpose=welcome recipient=${input.recipient} name=${input.name} loginUrl=${input.loginUrl} (stub)`);
  }
}
