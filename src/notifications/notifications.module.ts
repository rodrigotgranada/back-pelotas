import { Module } from '@nestjs/common';
import { EmailNotificationChannel } from './channels/email-notification.channel';
import { SmsNotificationChannel } from './channels/sms-notification.channel';
import { WhatsappNotificationChannel } from './channels/whatsapp-notification.channel';
import { NotificationsService } from './notifications.service';

@Module({
  providers: [
    NotificationsService,
    EmailNotificationChannel,
    SmsNotificationChannel,
    WhatsappNotificationChannel,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
