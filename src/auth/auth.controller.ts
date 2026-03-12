import { Body, Controller, Post, Req, UnauthorizedException, UseGuards } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ResendVerificationCodeDto } from './dto/resend-verification-code.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario registrado como pendente', type: AuthResponseDto })
  @ApiResponse({ status: 409, description: 'Email, documento ou telefone ja cadastrados' })
  register(@Body() createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Autenticar usuario e retornar JWT' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({ status: 201, description: 'Login realizado ou verificacao de email pendente', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Credenciais invalidas' })
  login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Validar codigo de verificacao de email' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 201, description: 'Email validado e usuario ativado', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Codigo invalido ou expirado' })
  verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<AuthResponseDto> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification-code')
  @ApiOperation({ summary: 'Reenviar codigo de verificacao de email (validade 2h)' })
  @ApiBody({ type: ResendVerificationCodeDto })
  @ApiResponse({
    status: 201,
    description: 'Codigo reenviado quando aplicavel',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Codigo reenviado, se o email existir e estiver pendente' },
        expiresInMinutes: { type: 'number', example: 120 },
      },
    },
  })
  resendVerificationCode(@Body() resendVerificationCodeDto: ResendVerificationCodeDto) {
    return this.authService.resendVerificationCode(resendVerificationCodeDto);
  }

  @Post('request-password-reset')
  @ApiOperation({ summary: 'Solicitar codigo para redefinir senha' })
  @ApiBody({ type: RequestPasswordResetDto })
  @ApiResponse({
    status: 201,
    description: 'Solicitacao processada sem revelar existencia do email',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Solicitacao processada, se o email existir' },
      },
    },
  })
  requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.requestPasswordReset(requestPasswordResetDto);
  }

  @Post('confirm-password-reset')
  @ApiOperation({ summary: 'Confirmar redefinicao de senha com codigo' })
  @ApiBody({ type: ConfirmPasswordResetDto })
  @ApiResponse({ status: 201, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Codigo invalido/expirado ou senha nao permitida' })
  confirmPasswordReset(@Body() confirmPasswordResetDto: ConfirmPasswordResetDto) {
    return this.authService.confirmPasswordReset(confirmPasswordResetDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Gerar novo access token a partir do refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({ status: 201, description: 'Tokens renovados', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Refresh token invalido ou expirado' })
  refresh(@Body() refreshTokenDto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refresh(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Encerrar sessao atual' })
  @ApiResponse({ status: 201, description: 'Sessao encerrada' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async logout(@Req() req: { user?: { sub?: string } }) {
    const userId = req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    await this.authService.logout(userId);

    return { message: 'Sessao encerrada' };
  }
}
