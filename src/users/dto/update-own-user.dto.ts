import { OmitType } from '@nestjs/swagger';
import { UpdateUserDto } from './update-user.dto';

export class UpdateOwnUserDto extends OmitType(UpdateUserDto, [
  'email',
  'roleId',
  'isActive',
  'emailVerified',
  'updatedBy',
] as const) {}
