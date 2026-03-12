import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ResendVerificationCodeDto {
  @ApiProperty({ example: 'usuario@pelotas.com.br' })
  @IsEmail()
  email: string;
}
