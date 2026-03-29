import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateInterestDto {
  @ApiPropertyOptional({ example: true, description: 'Se o interesse foi lido' })
  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @ApiPropertyOptional({ example: 'CONTACTED', enum: ['PENDING', 'CONTACTED', 'COMPLETED', 'REJECTED'] })
  @IsEnum(['PENDING', 'CONTACTED', 'COMPLETED', 'REJECTED'])
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ example: 'Cliente solicitou boleto', description: 'Notas internas' })
  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
