import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreateUserContactDto, CreateUserAddressDto } from './create-user.dto';

export class CreateAdminUserDto {
  @ApiProperty({ example: 'Joao', description: 'Primeiro nome do usuario' })
  @IsNotEmpty({ message: 'O primeiro nome e obrigatorio' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Silva', description: 'Sobrenome do usuario' })
  @IsNotEmpty({ message: 'O sobrenome e obrigatorio' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'joao@email.com', description: 'Email unico do usuario' })
  @IsNotEmpty({ message: 'O email e obrigatorio' })
  @IsEmail({}, { message: 'O email informado e invalido' })
  email: string;

  @ApiPropertyOptional({ example: '12345678901', description: 'Documento (CPF/CNPJ) do usuario' })
  @IsOptional()
  @IsString()
  document?: string;

  @ApiPropertyOptional({ example: 'cpf', description: 'Tipo do documento' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiProperty({ description: 'ID do Role (Cargo) para associar ao usuario' })
  @IsNotEmpty({ message: 'O cargo e obrigatorio' })
  @IsString()
  roleId: string;

  @ApiPropertyOptional({ description: 'Define se a conta estara ativa no momento da criacao', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Senha fixa opcional a ser configurada pelo administrador' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ type: [CreateUserContactDto], description: 'Contatos associados ao usuario' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateUserContactDto)
  contacts?: CreateUserContactDto[];

  @ApiPropertyOptional({ type: [CreateUserAddressDto], description: 'Enderecos associados ao usuario' })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateUserAddressDto)
  addresses?: CreateUserAddressDto[];
}
