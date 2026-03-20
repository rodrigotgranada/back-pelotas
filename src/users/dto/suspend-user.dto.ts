import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SuspendUserDto {
  @ApiProperty({ description: 'Motivo da suspensao', example: 'Violação dos Termos' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
