import { BadRequestException, Injectable } from '@nestjs/common';
import { EmailNotificationChannel } from './channels/email-notification.channel';
import { SmsNotificationChannel } from './channels/sms-notification.channel';
import { WhatsappNotificationChannel } from './channels/whatsapp-notification.channel';
import { NotificationChannel } from './channels/notification-channel.interface';
import { SendVerificationCodeInput, SendWelcomeEmailInput } from './notification.types';

@Injectable()
export class NotificationsService {
  private readonly channelMap: Record<string, NotificationChannel>;

  constructor(
    emailChannel: EmailNotificationChannel,
    smsChannel: SmsNotificationChannel,
    whatsappChannel: WhatsappNotificationChannel,
  ) {
    this.channelMap = {
      [emailChannel.type]: emailChannel,
      [smsChannel.type]: smsChannel,
      [whatsappChannel.type]: whatsappChannel,
    };
  }

  async sendVerificationCode(input: SendVerificationCodeInput): Promise<void> {
    const channel = this.channelMap[input.channel];

    if (!channel) {
      throw new BadRequestException(`Canal de notificacao nao suportado: ${input.channel}`);
    }

    await channel.sendVerificationCode(input);
  }

  async sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void> {
    const channel = this.channelMap[input.channel];

    if (!channel) {
      throw new BadRequestException(`Canal de notificacao nao suportado: ${input.channel}`);
    }

    await channel.sendWelcomeEmail(input);
  }
}
