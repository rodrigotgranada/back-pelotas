import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateSettingDto {
  @ApiProperty({ example: 'badgeUrl', description: 'Chave da configuração' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'https://...', description: 'Valor da configuração' })
  @IsString()
  value: string;
}
