import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { StripContextPipe } from './strip-context.pipe';
import { UserContextInterceptor } from './user-context.interceptor';
import { WebModule } from '../../../../../_apps/web/src/web.module';

export async function appUseValidator(app: INestApplication) {
  useContainer(app.select(WebModule), { fallbackOnErrors: true });
  app.useGlobalInterceptors(new UserContextInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errorMessages = [];
        validationErrors.forEach((error) => {
          errorMessages.push({
            field: error.property,
            errors: Object.keys(error.constraints).map((key) => {
              return {
                code: key,
                message: error.constraints[key],
              };
            }),
          });
        });
        return new BadRequestException(errorMessages);
      },
    }),
    new StripContextPipe(),
  );
}
