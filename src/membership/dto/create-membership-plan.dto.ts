import { IsString, IsNumber, IsArray, IsBoolean, IsOptional, IsEnum, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMembershipPlanDto {
  @ApiProperty({ example: 'Sócio Lobo Bravo', description: 'Nome do plano' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Acesso a todos os jogos...', description: 'Descrição do plano' })
  @IsString()
  description: string;

  @ApiProperty({ example: 49.90, description: 'Preço mensal/anual' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'monthly', enum: ['monthly', 'quarterly', 'yearly'] })
  @IsEnum(['monthly', 'quarterly', 'yearly'])
  interval: 'monthly' | 'quarterly' | 'yearly';

  @ApiProperty({ example: 'socio-lobo-bravo', description: 'Slug para a URL', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: ['Acesso VIP', 'Desconto na Loja'], description: 'Lista de benefícios' })
  @IsArray()
  @IsString({ each: true })
  benefits: string[];

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
