import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested, IsUrl, IsArray } from 'class-validator';

export class IdolStatisticsDto {
  @ApiPropertyOptional({ description: 'Número de partidas do ídolo' })
  @IsInt()
  @IsOptional()
  matches?: number;

  @ApiPropertyOptional({ description: 'Número de gols do ídolo' })
  @IsInt()
  @IsOptional()
  goals?: number;

  @ApiPropertyOptional({ description: 'Títulos conquistados em formato de tags', type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  titles?: string[];
}

export class CreateIdolDto {
  @ApiProperty({ description: 'Nome do Ídolo' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL da foto heroica do Ídolo' })
  @IsString()
  @IsNotEmpty()
  @IsUrl({}, { message: 'A URL da foto deve ser válida' })
  photoUrl: string;

  @ApiPropertyOptional({ description: 'Chave de armazenamento da foto para exclusão futura' })
  @IsString()
  @IsOptional()
  photoStorageKey?: string;

  @ApiProperty({ description: 'Texto longo contando a história do Ídolo' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ description: 'Define se é um atleta (exige statistics) ou torcedor/funcionário' })
  @IsBoolean()
  @IsOptional()
  isAthlete?: boolean;

  @ApiPropertyOptional({ description: 'Função/Papel do homenageado quando não é atleta (ex: Funcionário Ilustre, Torcedor Ilustre)' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ description: 'Estatísticas de atleta (obrigatório no app se isAthlete for true)', type: IdolStatisticsDto })
  @ValidateNested()
  @Type(() => IdolStatisticsDto)
  @IsOptional()
  statistics?: IdolStatisticsDto;

  @ApiPropertyOptional({ description: 'Indica se o ídolo está ativo para visualização pública' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição na lista' })
  @IsInt()
  @IsOptional()
  order?: number;
}
