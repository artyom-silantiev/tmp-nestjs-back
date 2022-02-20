import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtUser, RequestExpressJwt } from '@share/modules/auth/types';

export const REQUEST_CONTEXT = 'REQUEST_CONTEXT';

export interface RequestContext {
  user: JwtUser;
}

@Injectable()
export class UserContextInterceptor implements NestInterceptor {
  constructor() {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest() as RequestExpressJwt;

    if (request.user) {
      if (request.method === 'GET') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        request.query[REQUEST_CONTEXT] = {
          user: request.user,
        } as RequestContext;
      } else {
        request.body[REQUEST_CONTEXT] = {
          user: request.user,
        } as RequestContext;
      }
    }

    return next.handle();
  }
}
