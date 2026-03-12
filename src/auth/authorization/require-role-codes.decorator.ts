import { SetMetadata } from '@nestjs/common';

export const REQUIRED_ROLE_CODES_KEY = 'requiredRoleCodes';

export const RequireRoleCodes = (...roleCodes: string[]) =>
  SetMetadata(REQUIRED_ROLE_CODES_KEY, roleCodes.map((roleCode) => roleCode.toLowerCase()));
