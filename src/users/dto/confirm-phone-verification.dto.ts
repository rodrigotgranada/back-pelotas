import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConfirmPhoneVerificationDto {
  @ApiProperty({ example: '123456', description: 'Codigo de 6 digitos enviado para telefone' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'codigo deve conter 6 digitos numericos' })
  code: string;
}
