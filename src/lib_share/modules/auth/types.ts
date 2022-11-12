import { Request as ExpressRequest } from 'express';
import { UserRole } from '@prisma/client';
export class JwtUser {
  userId: string;
  role: UserRole;
}

export type RequestExpressJwt = ExpressRequest & {
  user: JwtUser;
};
