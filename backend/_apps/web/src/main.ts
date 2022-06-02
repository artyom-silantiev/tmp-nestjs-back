import { NestFactory } from '@nestjs/core';
import { WebModule } from './web.module';
import { Logger } from '@nestjs/common';
import { useRedis } from '@share/modules/redis/redis.apphook';
import { useClusterApp } from '@share/modules/cluster-app/cluster-app.apphook';
import { usePrisma } from '@db/prisma.apphook';
import { useS3 } from '@share/modules/s3/s3.apphook';
import { useIpfs } from '@share/modules/ipfs/ipfs.apphook';
import { useSwagger } from '@share/apphooks/swagger.apphook';
import { useValidator } from '@share/apphooks/validator/validator.apphook';
import { useDirs } from '@share/apphooks/dirs.apphook';
import { ClusterAppType, useEnv } from '@share/env/env';

async function bootstrap() {
  const app = await NestFactory.create(WebModule);
  const env = useEnv();
  const logger = new Logger('WebBootstrap');
  console.log('Web ENV:', env);

  await useDirs(env);
  await useRedis(app, {
    withIOAdapter: true,
  });
  await useClusterApp(app, ClusterAppType.Web);
  await usePrisma(app);
  await useS3(app);
  await useIpfs(app);
  await useValidator(app);

  // SWAGGER
  if (env.isDevEnv()) {
    await useSwagger(app);
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
