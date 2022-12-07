import { NestFactory } from '@nestjs/core';
import { WebModule } from './web.module';
import { useEnv } from '@share/lib/env/env';
import { Logger } from '@share/logger';

import { useAppWrap } from '@share/app-wrap';

import { appUseSwagger } from '@share/apphooks/swagger.apphook';
import { appUseValidator } from '@share/apphooks/validator/validator.apphook';
import { appUseDirs } from '@share/apphooks/dirs.apphook';
import { appUseRedisAdapter } from '@share/apphooks/redis/redis.apphook';

async function bootstrap() {
  const app = await NestFactory.create(WebModule);
  useAppWrap().setApp(app);

  const env = useEnv();
  const logger = new Logger('App');
  console.log('Web ENV:', env);

  await appUseDirs(env);
  await appUseValidator(app, WebModule);
  await appUseRedisAdapter(app);

  // SWAGGER
  if (env.isDevEnv()) {
    await appUseSwagger(app);
  }

  await app.listen(env.NODE_PORT, () => {
    if (env.isDevEnv()) {
      const addr = `http://${env.NODE_HOST}:${env.NODE_PORT}`;

      logger.log('###########################');
      logger.log(`The web app is launched and available on ${addr}`);
      logger.log(`Swagger: ${addr}/swagger`);
    }
  });
}
bootstrap();
