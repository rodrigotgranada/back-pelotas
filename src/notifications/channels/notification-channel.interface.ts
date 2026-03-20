import { SendVerificationCodeInput, SendWelcomeEmailInput } from '../notification.types';

export interface NotificationChannel {
  readonly type: SendVerificationCodeInput['channel'];
  sendVerificationCode(input: SendVerificationCodeInput): Promise<void>;
  sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void>;
}
