import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

export class UpdateInterestDto {
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsEnum(['PENDING', 'CONTACTED', 'COMPLETED', 'REJECTED'])
  @IsOptional()
  status?: string;
}
