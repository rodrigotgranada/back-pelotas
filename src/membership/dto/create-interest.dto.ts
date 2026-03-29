import { IsEmail, IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMembershipInterestDto {
  @ApiPropertyOptional({ example: '60d5ecb8b392d7001539a9c0' })
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'joao@email.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '+5553999999999' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: '60b5ecb8b392d7001539a9v1' })
  @IsMongoId()
  @IsNotEmpty()
  planId: string;

  @ApiProperty({ example: true })
  @IsNotEmpty()
  isWhatsApp: boolean;
}
