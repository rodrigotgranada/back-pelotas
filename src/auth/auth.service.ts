import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { StringValue } from 'ms';
import { RolesService } from '../roles/roles.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly rolesService: RolesService,
    private readonly configService: ConfigService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    const user = await this.usersService.create({
      ...createUserDto,
      roleId: undefined,
      isActive: true,
      emailVerified: false,
      createdBy: undefined,
    });

    await this.usersService.issueEmailVerificationCode(user.id);

    return {
      user,
      roleCode: undefined,
      requiresEmailVerification: true,
      verificationEmail: user.email,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    await this.usersService.ensureLoginNotBlocked(loginDto.email);

    const user = await this.usersService.validateCredentials(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      await this.usersService.registerFailedLoginAttempt(loginDto.email);
      throw new UnauthorizedException('Email ou senha invalidos');
    }

    if (!user.isActive || user.status === 'blocked' || user.status === 'suspended') {
      const reasonMsg = user.status === 'suspended' && user.statusReason ? ` - Motivo: ${user.statusReason}` : '';
      throw new UnauthorizedException(`Usuario inativo ou bloqueado${reasonMsg}`);
    }

    if (user.status === 'pending' || !user.emailVerified) {
      await this.usersService.issueEmailVerificationCode(user.id);

      return {
        user,
        roleCode: undefined,
        requiresEmailVerification: true,
        verificationEmail: user.email,
      };
    }

    return this.buildAuthResponse(user);
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<AuthResponseDto> {
    const user = await this.usersService.verifyEmailCode(verifyEmailDto.email, verifyEmailDto.code);
    return this.buildAuthResponse(user);
  }

  async resendVerificationCode(
    resendVerificationCodeDto: ResendVerificationCodeDto,
  ): Promise<{ message: string; expiresInMinutes: number }> {
    await this.usersService.resendEmailVerificationCode(resendVerificationCodeDto.email);

    return {
      message: 'Codigo reenviado, se o email existir e estiver pendente',
      expiresInMinutes: 120,
    };
  }

  async requestPasswordReset(
    requestPasswordResetDto: RequestPasswordResetDto,
  ): Promise<{ message: string }> {
    await this.usersService.issuePasswordResetCode(requestPasswordResetDto.email);

    return {
      message: 'Solicitacao processada, se o email existir',
    };
  }

  async confirmPasswordReset(confirmPasswordResetDto: ConfirmPasswordResetDto): Promise<{ message: string }> {
    await this.usersService.confirmPasswordReset(
      confirmPasswordResetDto.email,
      confirmPasswordResetDto.code,
      confirmPasswordResetDto.newPassword,
    );

    return {
      message: 'Senha redefinida com sucesso',
    };
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    const payload = await this.verifyRefreshToken(refreshTokenDto.refreshToken);

    if (!payload.sub || payload.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token invalido');
    }

    const isStoredTokenValid = await this.usersService.verifyStoredRefreshToken(
      payload.sub,
      refreshTokenDto.refreshToken,
    );

    if (!isStoredTokenValid) {
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }

    const user = await this.usersService.findOne(payload.sub);

    if (!user.isActive || user.status !== 'active') {
      const reasonMsg = user.status === 'suspended' && user.statusReason ? ` - Motivo: ${user.statusReason}` : '';
      throw new UnauthorizedException(`Usuario inativo ou bloqueado${reasonMsg}`);
    }

    return this.buildAuthResponse(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.clearStoredRefreshToken(userId);
  }

  private async buildAuthResponse(user: UserResponseDto): Promise<AuthResponseDto> {
    let roleCode: string | undefined;

    if (user.roleId) {
      const role = await this.rolesService.findById(user.roleId);
      roleCode = role?.code;
    }

    const payload = {
      sub: user.id,
      email: user.email,
      roleCode,
    };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshTokenPayload = {
      sub: user.id,
      type: 'refresh',
    };
    const refreshExpiresIn =
      this.configService.get<StringValue>('JWT_REFRESH_EXPIRES_IN') ?? ('7d' as StringValue);
    const refreshToken = await this.jwtService.signAsync(refreshTokenPayload, {
      expiresIn: refreshExpiresIn,
    });
    const refreshTokenExpiresAt = this.resolveTokenExpirationDate(refreshExpiresIn);

    await this.usersService.storeRefreshToken(user.id, refreshToken, refreshTokenExpiresAt);

    return {
      accessToken,
      refreshToken,
      user,
      roleCode,
      requiresEmailVerification: false,
      verificationEmail: user.email,
    };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<{ sub: string; type?: string }> {
    try {
      return await this.jwtService.verifyAsync<{ sub: string; type?: string }>(refreshToken, {
        secret: this.configService.get<string>('JWT_SECRET') ?? 'dev-secret',
      });
    } catch {
      throw new UnauthorizedException('Refresh token invalido ou expirado');
    }
  }

  private resolveTokenExpirationDate(expiresIn: StringValue): Date {
    const normalized = String(expiresIn).trim().toLowerCase();

    if (/^\d+$/.test(normalized)) {
      return new Date(Date.now() + Number(normalized) * 1000);
    }

    const match = normalized.match(/^(\d+)([smhd])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const value = Number(match[1]);
    const unit = match[2];
    const multiplierByUnit: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * (multiplierByUnit[unit] ?? 7 * 24 * 60 * 60 * 1000));
  }
}
