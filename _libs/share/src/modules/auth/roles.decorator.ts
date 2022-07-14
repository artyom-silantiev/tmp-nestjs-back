import { SetMetadata } from '@nestjs/common';
import { RolesGuardParams, ROLES_PARAMS_KEY } from './roles.guard';

export const Roles = (rolesGuardParams: RolesGuardParams) =>
  SetMetadata(ROLES_PARAMS_KEY, rolesGuardParams);
