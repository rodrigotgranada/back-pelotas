import { IsEmail, IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';

export class CreateMembershipInterestDto {
  @IsMongoId()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsMongoId()
  @IsNotEmpty()
  planId: string;

  @IsNotEmpty()
  isWhatsApp: boolean;
}
