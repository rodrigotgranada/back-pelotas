import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateSponsorDto {
  @ApiProperty({ description: 'Nome do patrocinador' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'URL do site do patrocinador' })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: 'A URL do site deve ser válida' })
  websiteUrl?: string;

  @ApiProperty({ description: 'URL da logo do patrocinador' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'A URL da logo deve ser válida' })
  logoUrl: string;

  @ApiPropertyOptional({ description: 'Chave de armazenamento da logo para exclusão futura' })
  @IsString()
  @IsOptional()
  logoStorageKey?: string;

  @ApiPropertyOptional({ description: 'Indica se o patrocinador está ativo na home' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição no carrossel' })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiPropertyOptional({ description: 'Data de expiração do contrato' })
  @IsDateString()
  @IsOptional()
  expirationDate?: string;
}
