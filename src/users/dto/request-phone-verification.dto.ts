import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString, Matches } from 'class-validator';

export class RequestPhoneVerificationDto {
  @ApiProperty({
    example: '+5553999999999',
    description: 'Telefone com DDI opcional; apenas digitos com opcional +',
  })
  @IsString()
  @Matches(/^\+?\d{10,15}$/, {
    message: 'telefone invalido. Use apenas numeros com DDI opcional',
  })
  phone: string;

  @ApiProperty({ example: 'sms', enum: ['sms', 'whatsapp'] })
  @IsString()
  @IsIn(['sms', 'whatsapp'])
  channel: 'sms' | 'whatsapp';
}
