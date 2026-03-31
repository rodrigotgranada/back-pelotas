import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SquadMemberDto {
  @ApiProperty()
  @IsString()
  athleteId: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  number?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  role?: string;
}

export class CreateSquadDto {
  @ApiProperty({ example: 2026 })
  @IsNumber()
  year: number;

  @ApiProperty({ example: 'Gauchão' })
  @IsString()
  competition: string;

  @ApiProperty({ example: 'Profissional Masculino' })
  @IsString()
  category: string;

  @ApiProperty({ type: [SquadMemberDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SquadMemberDto)
  members: SquadMemberDto[];

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  order?: number;
}
