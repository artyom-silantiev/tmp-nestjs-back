import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { useContainer } from 'class-validator';
import { StripContextPipe } from './strip-context.pipe';
import { UserContextInterceptor } from './user-context.interceptor';

export async function appUseValidator(
  app: INestApplication,
  appModuleClass: any,
) {
  useContainer(app.select(appModuleClass), { fallbackOnErrors: true });
  app.useGlobalInterceptors(new UserContextInterceptor());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const fieldsHasErrors = {} as {
          [fieldName: string]: {
            code: string;
            message: string;
          }[];
        };

        validationErrors.forEach((error) => {
          Object.keys(error.constraints).forEach((key: string) => {
            const fieldName = error.property;
            const errorCode = key;

            if (!fieldsHasErrors[fieldName]) {
              fieldsHasErrors[fieldName] = [];
            }
            fieldsHasErrors[fieldName].push({
              code: errorCode,
              message: error.constraints[key]
            })
          });
        });

        return new BadRequestException({
          fieldsHasErrors,
        });
      },
    }),
    new StripContextPipe(),
  );
}
