import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserContactResponseDto {
  @ApiProperty({ example: 'mobile' })
  type: string;

  @ApiProperty({ example: '5553999999999' })
  value: string;

  @ApiProperty({ example: true })
  isPrimary: boolean;

  @ApiPropertyOptional({ example: '2026-03-08T10:00:00.000Z' })
  verifiedAt?: Date;
}

export class UserAddressResponseDto {
  @ApiProperty({ example: 'home' })
  type: string;

  @ApiProperty({ example: 'Rua A' })
  street: string;

  @ApiProperty({ example: '123' })
  number: string;

  @ApiPropertyOptional({ example: 'Apto 201' })
  complement?: string;

  @ApiProperty({ example: 'Centro' })
  neighborhood: string;

  @ApiProperty({ example: 'Pelotas' })
  city: string;

  @ApiProperty({ example: 'RS' })
  state: string;

  @ApiProperty({ example: '96000000' })
  zipCode: string;

  @ApiProperty({ example: 'BR' })
  country: string;

  @ApiProperty({ example: true })
  isPrimary: boolean;
}

export class UserResponseDto {
  @ApiProperty({ example: '69ad688617d7de52325e3b65' })
  id: string;

  @ApiProperty({ example: 'Rodrigo Granada' })
  name: string;

  @ApiProperty({ example: 'rodrigo@pelotas.dev' })
  email: string;

  @ApiPropertyOptional({ example: '12345678901' })
  document?: string;

  @ApiPropertyOptional({ example: 'cpf' })
  documentType?: string;

  @ApiPropertyOptional({ example: '69ad688617d7de52325e3b66' })
  roleId?: string;

  @ApiPropertyOptional({ example: 'https://cdn.pelotas.dev/users/1.jpg' })
  photoUrl?: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ApiPropertyOptional({ example: '2026-03-08T11:00:00.000Z' })
  lastLoginAt?: Date;

  @ApiPropertyOptional({ example: '2026-03-08T11:00:00.000Z' })
  passwordUpdatedAt?: Date;

  @ApiProperty({ example: '2026-03-08T10:00:00.000Z' })
  createdAt: Date;

  @ApiPropertyOptional({ example: '69ad688617d7de52325e3b67' })
  createdBy?: string;

  @ApiProperty({ example: '2026-03-08T10:30:00.000Z' })
  updatedAt: Date;

  @ApiPropertyOptional({ example: '69ad688617d7de52325e3b68' })
  updatedBy?: string;

  @ApiPropertyOptional({ example: null })
  deletedAt?: Date;

  @ApiPropertyOptional({ example: null })
  deletedBy?: string;

  @ApiPropertyOptional({ type: UserContactResponseDto, isArray: true })
  contacts?: UserContactResponseDto[];

  @ApiPropertyOptional({ type: UserAddressResponseDto, isArray: true })
  addresses?: UserAddressResponseDto[];
}
