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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserContactDto {
  @ApiProperty({ example: 'mobile', description: 'Tipo do contato' })
  @IsString()
  type: string;

  @ApiProperty({
    example: '+5553999999999',
    description: 'Valor do contato. Para telefone, use apenas numeros com DDI opcional',
  })
  @IsString()
  @ValidateIf((object: CreateUserContactDto) =>
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

export class CreateUserAddressDto {
  @ApiProperty({ example: 'home' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'Rua A' })
  @IsString()
  street: string;

  @ApiProperty({ example: '123' })
  @IsString()
  number: string;

  @ApiPropertyOptional({ example: 'Apto 201' })
  @IsOptional()
  @IsString()
  complement?: string;

  @ApiProperty({ example: 'Centro' })
  @IsString()
  neighborhood: string;

  @ApiProperty({ example: 'Pelotas' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'RS' })
  @IsString()
  state: string;

  @ApiProperty({ example: '96000000' })
  @IsString()
  zipCode: string;

  @ApiProperty({ example: 'BR' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateUserDto {
  @ApiProperty({ example: 'Rodrigo', minLength: 2 })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({ example: 'Granada', minLength: 2 })
  @IsString()
  @MinLength(2)
  lastName: string;

  @ApiProperty({ example: 'rodrigo@pelotas.dev' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

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

  @ApiPropertyOptional({ example: 'https://cdn.pelotas.dev/users/1.jpg' })
  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiPropertyOptional({ example: '69ad688617d7de52325e3b65' })
  @IsOptional()
  @IsMongoId()
  createdBy?: string;

  @ApiPropertyOptional({ type: CreateUserContactDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserContactDto)
  contacts?: CreateUserContactDto[];

  @ApiPropertyOptional({ type: CreateUserAddressDto, isArray: true })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserAddressDto)
  addresses?: CreateUserAddressDto[];
}
