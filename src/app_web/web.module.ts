import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { useEnv } from '@share/lib/env/env';
import * as fs from 'fs-extra';
import {
  ServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';
import { CronService } from './cron.service';
import { EmailIsUniqueRule } from './decorators/email-is-unique.decorator';
import { AuthMiddleware } from '@share/modules/auth/auth.middleware';

import { AuthModule } from '@share/modules/auth/auth.module';
import { JwtUserAuthService } from '@share/modules/jwt/jwt-user-auth.service';
import { I18NextModule } from '@share/modules/i18next';
import { DbModule } from '@db/db.module';
import { ClusterAppModule } from '@share/modules/cluster-app/cluster-app.module';
import { UserModule } from './modules/user/user.module';
import { GuestModule } from './modules/guest/guest.module';
import { IpfsModule } from '@share/modules/ipfs/ipfs.module';
import { LocalFilesModule } from '@share/modules/local_files/local_files.module';
import { CommonModule } from './modules/common/common.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppMailerModule } from '@share/modules/app-mailer/app-mailer.module';
import { S3Module } from '@share/modules/s3/s3.module';
@Module({
  imports: [
    DbModule,
    S3Module,
    ClusterAppModule,
    AuthModule,
    I18NextModule,
    AppMailerModule,
    ScheduleModule.forRoot(),

    // Router
    CommonModule,
    UserModule,
    GuestModule,
    IpfsModule,
    LocalFilesModule,
    RouterModule.register([
      {
        path: 'api',
        module: CommonModule,
        children: [
          {
            path: 'user',
            module: UserModule,
          },
          {
            path: 'guest',
            module: GuestModule,
          },
        ],
      },
      {
        path: 'ipfs',
        module: IpfsModule,
      },
      {
        path: 'local_files',
        module: LocalFilesModule,
      },
    ]),

    // Static
    ServeStaticModule.forRootAsync({
      useFactory: async () => {
        const env = useEnv();
        console.log(env.DIR_ASSETS_PUBLIC);

        const options = [
          {
            rootPath: env.DIR_ASSETS_PUBLIC,
            serveRoot: '/static_b',
          },
        ] as ServeStaticModuleOptions[];

        try {
          const stat = await fs.stat(env.DIR_FRONT_APP_MAIN);
          if (stat.isDirectory) {
            options.push({
              rootPath: env.DIR_FRONT_APP_MAIN,
              renderPath: '/*',
              // exclude: ['/content*', '/sha256*', '/api*', '/static_b'],
            });
          }
        } catch (error) {}

        return options;
      },
    }),
  ],
  controllers: [],
  providers: [CronService, JwtUserAuthService, EmailIsUniqueRule],
})
export class WebModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '/api/*', method: RequestMethod.ALL });
  }
}
