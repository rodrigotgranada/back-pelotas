import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class ConfirmEmailChangeDto {
  @ApiProperty({ example: '123456', description: 'Codigo de 6 digitos enviado por email' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'codigo deve conter 6 digitos numericos' })
  code: string;
}
