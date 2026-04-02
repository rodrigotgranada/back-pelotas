import { IsBoolean, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCompetitionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  season: string;

  @IsString()
  @IsOptional()
  externalTableUrl?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  logoStorageKey?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateCompetitionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  season?: string;

  @IsString()
  @IsOptional()
  externalTableUrl?: string;

  @IsString()
  @IsOptional()
  logoUrl?: string;

  @IsString()
  @IsOptional()
  logoStorageKey?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
