import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { Transporter } from 'nodemailer';
import { NotificationChannel } from './notification-channel.interface';
import { SendVerificationCodeInput, SendWelcomeEmailInput } from '../notification.types';

@Injectable()
export class EmailNotificationChannel implements NotificationChannel {
  readonly type = 'email' as const;
  private readonly logger = new Logger(EmailNotificationChannel.name);
  private transporter: Transporter | null = null;

  constructor(private readonly configService: ConfigService) {}

  async sendWelcomeEmail(input: SendWelcomeEmailInput): Promise<void> {
    if (!this.isEmailEnabled()) {
      this.logger.warn(`[email-disabled] purpose=welcome recipient=${input.recipient}`);
      return;
    }

    const transport = this.getTransporter();
    if (!transport) {
      this.logger.warn(`[email-misconfigured] purpose=welcome recipient=${input.recipient}`);
      return;
    }

    const subject = 'Bem-vindo(a)! Sua conta foi criada.';
    const passwordMsgText = input.temporaryPassword ? `Sua senha temporaria de acesso e: ${input.temporaryPassword}\n` : 'Acesse seu painel para continuar.\n';
    const passwordMsgHtml = input.temporaryPassword ? `<p>Sua senha provisória de acesso é: <strong>${input.temporaryPassword}</strong></p>` : '<p>Acesse seu painel pelo botão abaixo.</p>';

    const text = 
      `Ola ${input.name},\n\n` +
      `Sua conta acabou de ser criada com sucesso.\n` +
      passwordMsgText +
      `Para acessar, va ate o link: ${input.loginUrl}\n\n` +
      `Seja bem-vindo(a)!`;

    const html = 
      `<p>Olá <strong>${input.name}</strong>,</p>` +
      `<p>Sua conta acabou de ser criada com sucesso no sistema.</p>` +
      passwordMsgHtml +
      `<p><a href="${input.loginUrl}" style="display:inline-block;padding:10px 20px;background-color:#0891b2;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;">Acessar a Plataforma</a></p>` +
      `<p>Seja bem-vindo(a)!</p>`;

    await transport.sendMail({
      from: this.getFromAddress(),
      to: input.recipient,
      subject,
      text,
      html,
    });

    this.logger.log(`[email-sent] purpose=welcome recipient=${input.recipient}`);
  }

  async sendVerificationCode(input: SendVerificationCodeInput): Promise<void> {
    if (!this.isEmailEnabled()) {
      this.logger.warn(
        `[email-disabled] purpose=${input.purpose} recipient=${input.recipient} code=${input.code}`,
      );
      return;
    }

    const transport = this.getTransporter();
    if (!transport) {
      this.logger.warn(
        `[email-misconfigured] purpose=${input.purpose} recipient=${input.recipient} code=${input.code}`,
      );
      return;
    }

    const subject =
      input.purpose === 'email-verification'
        ? 'Codigo de verificacao da conta'
        : input.purpose === 'phone-verification'
          ? 'Codigo de verificacao de telefone'
          : input.purpose === 'password-reset'
            ? 'Codigo para redefinir sua senha'
        : 'Codigo para confirmar troca de email';

    const text =
      `Seu codigo: ${input.code}\n` +
      `Validade: ${input.expiresInHours} horas\n` +
      'Se voce nao solicitou, ignore este email.';

    const html = `<p>Seu codigo: <strong>${input.code}</strong></p>
<p>Validade: <strong>${input.expiresInHours} horas</strong></p>
<p>Se voce nao solicitou, ignore este email.</p>`;

    await transport.sendMail({
      from: this.getFromAddress(),
      to: input.recipient,
      subject,
      text,
      html,
    });

    this.logger.log(`[email-sent] purpose=${input.purpose} recipient=${input.recipient}`);
  }

  private isEmailEnabled(): boolean {
    const value = this.configService.get<string>('NOTIFICATIONS_EMAIL_ENABLED') ?? 'true';
    return value.toLowerCase() !== 'false';
  }

  private getTransporter(): Transporter | null {
    if (this.transporter) {
      return this.transporter;
    }

    const user =
      this.configService.get<string>('SMTP_USER') ?? this.configService.get<string>('MAIL_USER');

    const clientId = this.configService.get<string>('MAIL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('MAIL_CLIENT_SECRET');
    const rawRefreshToken = this.configService.get<string>('MAIL_REFRESH_TOKEN');
    const refreshToken = rawRefreshToken?.replace(/\s/g, '');
    const rawAccessToken = this.configService.get<string>('MAIL_ACCESS_TOKEN');
    const accessToken = rawAccessToken?.replace(/\s/g, '');

    if (user && clientId && clientSecret && refreshToken) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user,
          clientId,
          clientSecret,
          refreshToken,
          accessToken,
        },
      });

      return this.transporter;
    }

    const host =
      this.configService.get<string>('SMTP_HOST') ??
      this.configService.get<string>('MAIL_HOST') ??
      'smtp.gmail.com';
    const port = Number(
      this.configService.get<string>('SMTP_PORT') ??
        this.configService.get<string>('MAIL_PORT') ??
        '465',
    );
    const secureValue = this.configService.get<string>('SMTP_SECURE') ?? 'true';
    const rawPass =
      this.configService.get<string>('SMTP_PASS') ?? this.configService.get<string>('MAIL_PASS');
    const pass = rawPass?.replace(/\s/g, '');

    if (!user || !pass) {
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: secureValue.toLowerCase() === 'true',
      auth: { user, pass },
    });

    return this.transporter;
  }

  private getFromAddress(): string {
    const fromAddress = this.configService.get<string>('MAIL_FROM_ADDRESS');
    const fromName = this.configService.get<string>('MAIL_FROM_NAME') ?? 'Pelotas';
    const fallbackUser =
      this.configService.get<string>('SMTP_USER') ??
      this.configService.get<string>('MAIL_USER') ??
      'no-reply@localhost';
    const senderAddress = fromAddress ?? fallbackUser;

    return `"${fromName}" <${senderAddress}>`;
  }
}
