import { NestFactory } from '@nestjs/core';
import { ServerModule } from './server.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { JWTAuthName } from '@share/constans';
import { EnvService } from '@share/modules/env/env.service';
import { UserContextInterceptor } from './user-context.interceptor';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { useContainer, ValidationError } from 'class-validator';
import { StripContextPipe } from './strip-context.pipe';
import * as fs from 'fs-extra';
import { RedisIoAdapter } from '@share/redis-io-adapter';
import { PrismaService } from '@db/prisma.service';
import { ClusterAppService } from '@share/modules/cluster-app/cluster-app.service';
import { ClusterAppType } from '@share/modules/cluster-app/cluster-app.types';
import { ClusterAppModule } from '@share/modules/cluster-app/cluster-app.module';
import { IpfsModule } from '@share/modules/ipfs/ipfs.module';
import { IpfsIndexService } from '@share/modules/ipfs/ipfs-index.service';

async function bootstrap() {
  // TODO cors
  const app = await NestFactory.create(ServerModule, { cors: true });
  const env = app.get(EnvService);
  const logger = new Logger('ServerBootstrap');
  console.log('Server ENV:', env);

  // CLUSTER APP
  const clusterApp = app.select(ClusterAppModule).get(ClusterAppService);
  await clusterApp.initClusterApp(ClusterAppType.Web);

  // IpfsIndex
  const ipfsIndex = app.select(IpfsModule).get(IpfsIndexService);
  await ipfsIndex.init(true);

  // IO
  app.useWebSocketAdapter(new RedisIoAdapter(app));

  // STUFF
  useContainer(app.select(ServerModule), { fallbackOnErrors: true });
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

  // DIRS
  await fs.mkdirs(env.DIR_TEMP_FILES);

  // PRISMA
  const prismaService: PrismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  // SWAGGER
  if (env.isDevEnv()) {
    const config = new DocumentBuilder()
      .setTitle('API')
      .setDescription(
        [
          'Jesusstream REST api<br>',
          'Default admin email: admin@example.com',
          'Default admin password: password',
        ].join('<br>'),
      )
      .setVersion('0.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        JWTAuthName, // This name here is important for matching up with @ApiBearerAuth() in your controller!
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('swagger', app, document);
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
