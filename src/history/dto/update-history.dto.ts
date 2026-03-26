import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { CreateHistoryDto } from './create-history.dto';

export class UpdateHistoryDto extends PartialType(CreateHistoryDto) {
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
