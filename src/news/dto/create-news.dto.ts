import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { NewsFormat, NewsStatus } from '../entities/news.entity';

export class CreateNewsDto {
  @ApiProperty({ description: 'Título da notícia' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Subtítulo da notícia' })
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiProperty({ description: 'Conteúdo da notícia (HTML ou JSON)' })
  @IsNotEmpty()
  content: any;

  @ApiProperty({ description: 'Formato do conteúdo', enum: ['HTML', 'BLOCKS'] })
  @IsNotEmpty()
  @IsEnum(['HTML', 'BLOCKS'])
  format: NewsFormat;

  @ApiPropertyOptional({ description: 'URL da imagem de capa' })
  @IsOptional()
  @IsString()
  coverImageUrl?: string;

  @ApiPropertyOptional({ description: 'Status inicial', enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED', 'ARCHIVED'])
  status?: NewsStatus;

  @ApiPropertyOptional({ description: 'Destaca a notícia na home (Globo Esporte style)' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsString()
  authorDisplayName?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowLikes?: boolean;
}
