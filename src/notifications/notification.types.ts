export type NotificationChannelType = 'email' | 'sms' | 'whatsapp';

export interface SendVerificationCodeInput {
  channel: NotificationChannelType;
  recipient: string;
  code: string;
  purpose:
    | 'email-verification'
    | 'email-change-confirmation'
    | 'phone-verification'
    | 'password-reset';
  expiresInHours: number;
}

export interface SendWelcomeEmailInput {
  channel: NotificationChannelType;
  recipient: string;
  name: string;
  temporaryPassword?: string;
  loginUrl: string;
}
