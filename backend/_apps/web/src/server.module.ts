import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { EnvModule } from '@share/modules/env/env.module';
import { StaticContentModule } from './modules/static-content.module';
import { ControllersModule } from './controllers/controllers.module';
import { AuthMiddleware } from '@share/modules/auth/auth.middleware';
import { AuthModule } from '@share/modules/auth/auth.module';
import { JwtUserAuthService } from '@share/modules/jwt/jwt-user-auth.service';
import { I18NextModule } from '@share/modules/i18next';
import { EmailIsUniqueRule } from './decorators/email-is-unique.decorator';
import { DbModule } from '@db/db.module';
import { CommonModule } from '@share/modules/common/common.module';
import { ClusterAppModule } from '@share/modules/cluster-app/cluster-app.module';

@Module({
  imports: [
    CommonModule,
    EnvModule,
    DbModule,
    ClusterAppModule,
    ControllersModule,
    AuthModule,
    I18NextModule,
    StaticContentModule.register(),
  ],
  controllers: [],
  providers: [JwtUserAuthService, EmailIsUniqueRule],
})
export class ServerModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes({ path: '/api/*', method: RequestMethod.ALL });
  }
}
