import { NestMiddleware, Injectable, ForbiddenException } from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtUser } from './types';

/** The AuthMiddleware is used to
 * (1) read the request header bearer token/user access token
 * (2) decrypt the access token to get the user object
 */
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private autchService: AuthService) {}

  private async getJwtUser(accessToken: string): Promise<JwtUser> {
    return this.autchService.cheackAccessToken(accessToken);
  }

  async use(req: Request | any, res: Response, next: () => void) {
    const bearerHeader = req.headers.authorization;
    const accessToken = bearerHeader && bearerHeader.split(' ')[1];
    let jwtUser: JwtUser;

    if (!bearerHeader || !accessToken) {
      return next();
    }

    try {
      jwtUser = await this.getJwtUser(accessToken);
    } catch (error) {
      throw new ForbiddenException('Please register or sign in.');
    }

    if (jwtUser) {
      req.user = jwtUser;
    }

    next();
  }
}
