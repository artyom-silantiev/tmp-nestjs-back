import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JWTAuthName } from '@share/constans';
import { AuthGuard } from './auth.guard';
import { Roles } from './roles.decorator';
import { RolesGuard, RolesGuardParams } from './roles.guard';

export interface AclParams {
  rolesGuard?: RolesGuardParams;
}

export const AclScopes = {
  denyGuest: {
    rolesGuard: { type: 'deny', roles: [UserRole.GUEST] } as RolesGuardParams,
  },
  allowAdmin: {
    rolesGuard: { type: 'allow', roles: [UserRole.ADMIN] } as RolesGuardParams,
  },
};

export function ACL(params?: AclParams) {
  const decorators = [UseGuards(AuthGuard, RolesGuard)] as (MethodDecorator &
    ClassDecorator)[];

  if (params && params.rolesGuard) {
    decorators.push(Roles(params.rolesGuard));
  }

  decorators.push(ApiBearerAuth(JWTAuthName));
  decorators.push(ApiUnauthorizedResponse({ description: 'Unauthorized' }));

  return applyDecorators(...decorators);
}
