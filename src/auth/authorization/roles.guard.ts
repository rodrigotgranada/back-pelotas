import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_ROLE_CODES_KEY } from './require-role-codes.decorator';

interface RequestUser {
  sub?: string;
  roleCode?: string;
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoleCodes = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_ROLE_CODES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoleCodes || requiredRoleCodes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: RequestUser }>();
    const roleCode = request.user?.roleCode?.toLowerCase();

    if (!roleCode || !requiredRoleCodes.includes(roleCode)) {
      throw new ForbiddenException('Usuario sem permissao para acessar este recurso');
    }

    return true;
  }
}
