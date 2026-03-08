import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'usuario@pelotas.dev' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;
}
