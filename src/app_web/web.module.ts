import { Module } from '@nestjs/common';

import { ClusterAppModule } from '@share/modules/cluster-app/cluster-app.module';
import { AppRouterModule } from './router/router.module';
import { ClusterAppType } from '@share/lib/env/env';
import { CronModule } from './cron/cron.module';
@Module({
  imports: [
    ClusterAppModule.register(ClusterAppType.Web),
    CronModule,
    AppRouterModule,
  ],
})
export class WebModule {}
