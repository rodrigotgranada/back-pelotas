import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsMongoId, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

class MatchGoalDto {
  @IsInt()
  @IsNotEmpty()
  minute: number;

  @IsString()
  @IsNotEmpty()
  scorer: string;

  @IsEnum(['PELOTAS', 'OPPONENT'])
  @IsNotEmpty()
  team: 'PELOTAS' | 'OPPONENT';
}

export class CreateMatchDto {
  @IsMongoId()
  @IsOptional()
  competitionId: string;

  @IsMongoId()
  @IsNotEmpty()
  opponentId: string;

  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  stadium: string;

  @IsBoolean()
  @IsOptional()
  isHome?: boolean;

  @IsInt()
  @IsOptional()
  homeScore?: number;

  @IsInt()
  @IsOptional()
  awayScore?: number;

  @IsEnum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED'])
  @IsOptional()
  status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MatchGoalDto)
  goals?: MatchGoalDto[];

  @IsString()
  @IsOptional()
  ticketsUrl?: string;

  @IsString()
  @IsOptional()
  transmissionUrl?: string;

  @IsMongoId()
  @IsOptional()
  newsId?: string;
}

export class UpdateMatchDto {
  @IsMongoId()
  @IsOptional()
  competitionId?: string;

  @IsMongoId()
  @IsOptional()
  opponentId?: string;

  @IsDateString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  stadium?: string;

  @IsBoolean()
  @IsOptional()
  isHome?: boolean;

  @IsInt()
  @IsOptional()
  homeScore?: number;

  @IsInt()
  @IsOptional()
  awayScore?: number;

  @IsEnum(['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED'])
  @IsOptional()
  status?: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MatchGoalDto)
  goals?: MatchGoalDto[];

  @IsString()
  @IsOptional()
  ticketsUrl?: string;

  @IsString()
  @IsOptional()
  transmissionUrl?: string;

  @IsMongoId()
  @IsOptional()
  newsId?: string;
}
