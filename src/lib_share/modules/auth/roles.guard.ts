import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { JwtUser } from './types';

export const ROLES_PARAMS_KEY = 'roles';
export interface RolesGuardParams {
  type: 'allow' | 'deny';
  roles: UserRole[];
}

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesGuardParams = this.reflector.getAllAndOverride<RolesGuardParams>(
      ROLES_PARAMS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!rolesGuardParams || rolesGuardParams.roles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user as JwtUser;

    let userRole = UserRole.GUEST as UserRole;
    if (user) {
      userRole = user.role;
    }

    if (rolesGuardParams.type === 'allow') {
      const allowRoles = rolesGuardParams.roles;
      for (const role of allowRoles) {
        if (userRole === role) {
          return true;
        }
      }
      return false;
    } else {
      const denyRoles = rolesGuardParams.roles;
      for (const role of denyRoles) {
        if (userRole === role) {
          return false;
        }
      }
      return true;
    }
  }
}
