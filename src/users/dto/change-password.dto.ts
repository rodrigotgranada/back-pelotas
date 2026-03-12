import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'senhaAtual123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ example: 'NovaSenha@2026' })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
