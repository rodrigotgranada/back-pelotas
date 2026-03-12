import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class RequestEmailChangeDto {
  @ApiProperty({ example: 'novo.email@pelotas.com.br' })
  @IsEmail()
  newEmail: string;
}
