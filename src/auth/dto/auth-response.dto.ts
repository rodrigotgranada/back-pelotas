import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', required: false })
  accessToken?: string;

  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', required: false })
  refreshToken?: string;

  @ApiProperty({ type: UserResponseDto, required: false })
  user: UserResponseDto;

  @ApiProperty({ example: 'admin', required: false })
  roleCode?: string;

  @ApiProperty({ example: true, required: false })
  requiresEmailVerification?: boolean;

  @ApiProperty({ example: 'usuario@pelotas.com.br', required: false })
  verificationEmail?: string;
}
