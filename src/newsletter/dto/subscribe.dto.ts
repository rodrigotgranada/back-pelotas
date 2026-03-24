import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 'torcedor@pelotas.com.br' })
  @IsEmail({}, { message: 'Por favor, informe um e-mail válido.' })
  @IsNotEmpty({ message: 'O e-mail é obrigatório.' })
  email: string;
}
