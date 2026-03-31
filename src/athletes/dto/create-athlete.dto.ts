import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsDateString, IsNumber, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class PreviousClubDto {
  @ApiProperty({ example: 2023 })
  @IsNumber()
  yearStart: number;

  @ApiPropertyOptional({ example: 2024 })
  @IsNumber()
  @IsOptional()
  yearEnd?: number;

  @ApiProperty({ example: 'Grêmio' })
  @IsString()
  club: string;
}

export class CreateAthleteDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty()
  @IsString()
  photoUrl: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  photoStorageKey?: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  positions: string[];

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  hometown?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  preferredFoot?: string;

  @ApiPropertyOptional({ type: [PreviousClubDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreviousClubDto)
  @IsOptional()
  previousClubs?: PreviousClubDto[];

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isStaff?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
