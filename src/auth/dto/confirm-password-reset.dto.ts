import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches, MinLength } from 'class-validator';

export class ConfirmPasswordResetDto {
  @ApiProperty({ example: 'usuario@pelotas.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'codigo deve conter 6 digitos numericos' })
  code: string;

  @ApiProperty({ example: 'NovaSenha@2026' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
