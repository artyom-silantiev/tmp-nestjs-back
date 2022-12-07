import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { CronService } from './cron.service';
import { EmailIsUniqueRule } from '@share/decorators/email-is-unique.decorator';
import { AuthMiddleware } from '@share/modules/auth/auth.middleware';

import { AuthModule } from '@share/modules/auth/auth.module';
import { JwtUserAuthService } from '@share/modules/jwt/jwt-user-auth.service';
import { I18NextModule } from '@share/modules/i18next';
import { DbModule } from '@db/db.module';
import { ClusterAppModule } from '@share/modules/cluster-app/cluster-app.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppMailerModule } from '@share/modules/app-mailer/app-mailer.module';
import { S3Module } from '@share/modules/s3/s3.module';
import { AppRouterModule } from './router/router.module';
import { ClusterAppType } from '@share/lib/env/env';
@Module({
  imports: [
    ClusterAppModule.register(ClusterAppType.Web),
    DbModule,
    S3Module,
    AuthModule,
    I18NextModule,
    AppMailerModule,
    ScheduleModule.forRoot(),
    AppRouterModule,
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
