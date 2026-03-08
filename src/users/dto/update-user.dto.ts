import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsISO8601,
  IsMongoId,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserContactDto {
  @ApiPropertyOptional({ example: 'mobile' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: '+5553999999999' })
  @IsString()
  @ValidateIf((object: UpdateUserContactDto) =>
    ['phone', 'mobile', 'whatsapp'].includes(object.type.toLowerCase()),
  )
  @Matches(/^\+?\d{10,15}$/, {
    message: 'telefone invalido. Use apenas numeros com DDI opcional',
  })
  value: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;

  @ApiPropertyOptional({ example: '2026-03-08T10:00:00.000Z' })
  @IsOptional()
  @IsISO8601()
  verifiedAt?: string;
}

export class UpdateUserAddressDto {
  @ApiPropertyOptional({ example: 'home' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ example: 'Rua A' })
  @IsString()
  street: string;

  @ApiPropertyOptional({ example: '123' })
  @IsString()
  number: string;

  @ApiPropertyOptional({ example: 'Apto 201' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsString()
  neighborhood: string;

  @ApiPropertyOptional({ example: 'Pelotas' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ example: 'RS' })
  @IsString()
  state: string;

  @ApiPropertyOptional({ example: '96000000' })
  @IsString()
  zipCode: string;

  @ApiPropertyOptional({ example: 'BR' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Rodrigo Granada', minLength: 3 })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({ example: 'novo-email@pelotas.dev' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: 'NovaSenha123', minLength: 6 })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: '12345678901', description: 'CPF somente numeros' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+$/, { message: 'document deve conter apenas numeros' })
  document?: string;

  @ApiPropertyOptional({ example: 'cpf' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ example: '69ad688617d7de52325e3b65' })
  @IsOptional()
  @IsMongoId()
  roleId?: string;

  @ApiPropertyOptional({ example: 'https://cdn.pelotas.dev/users/2.jpg' })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ example: '69ad688617d7de52325e3b65' })
  @IsOptional()
  @IsMongoId()
  updatedBy?: string;

  @ApiPropertyOptional({ type: UpdateUserContactDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserContactDto)
  contacts?: UpdateUserContactDto[];

  @ApiPropertyOptional({ type: UpdateUserAddressDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateUserAddressDto)
  addresses?: UpdateUserAddressDto[];
}
