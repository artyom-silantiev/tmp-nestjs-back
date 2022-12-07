import { NestFactory } from '@nestjs/core';
import { WebModule } from './web.module';
import { ClusterAppType, useEnv } from '@share/lib/env/env';
import { Logger } from '@share/logger';

import { appUseSwagger } from '@share/apphooks/swagger.apphook';
import { appUseValidator } from '@share/apphooks/validator/validator.apphook';
import { appUseDirs } from '@share/apphooks/dirs.apphook';

// TODO app hooks for modules is bad ... hm
import { appUseRedis } from '@share/modules/redis/redis.apphook';
import { appUseClusterApp } from '@share/modules/cluster-app/cluster-app.apphook';
import { appUsePrisma } from '@db/prisma.apphook';
import { appUseS3 } from '@share/modules/s3/s3.apphook';
import { appUseIpfs } from '@share/modules/ipfs/ipfs.apphook';

async function bootstrap() {
  const app = await NestFactory.create(WebModule);
  const env = useEnv();
  const logger = new Logger('App');
  console.log('Web ENV:', env);

  await appUseDirs(env);
  await appUseValidator(app);

  await appUseRedis(app, {
    withIOAdapter: true,
  });
  await appUseClusterApp(app, ClusterAppType.Web);
  await appUsePrisma(app);
  await appUseS3(app);
  await appUseIpfs(app);

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
