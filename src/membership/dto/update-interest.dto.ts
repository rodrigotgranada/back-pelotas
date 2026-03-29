import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateInterestDto {
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsEnum(['PENDING', 'CONTACTED', 'COMPLETED', 'REJECTED'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
