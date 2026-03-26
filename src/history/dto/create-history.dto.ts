import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString, MinLength, IsNotEmpty } from 'class-validator';

export class CreateHistoryDto {
  @ApiProperty({ description: 'Título da seção histórica' })
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty({ description: 'Slug único da seção' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'Conteúdo da seção (JSON Editor.js ou HTML)' })
  @IsNotEmpty()
  content: any;

  @ApiPropertyOptional({ enum: ['HTML', 'BLOCKS'], default: 'BLOCKS' })
  @IsEnum(['HTML', 'BLOCKS'])
  @IsOptional()
  format?: 'HTML' | 'BLOCKS' = 'BLOCKS';

  @ApiPropertyOptional({ description: 'URL da imagem de capa' })
  @IsString()
  @IsOptional()
  coverImageUrl?: string | null;

  @ApiPropertyOptional({ description: 'Ordem de exibição', default: 0 })
  @IsNumber()
  @IsOptional()
  order?: number = 0;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
