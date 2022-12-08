import { Module } from '@nestjs/common';

import { ClusterAppModule } from '@share/modules/cluster-app/cluster-app.module';
import { AppRouterModule } from './router/router.module';
import { ClusterAppType } from '@share/lib/env/env';
@Module({
  imports: [ClusterAppModule.register(ClusterAppType.Web), AppRouterModule],
})
export class WebModule {}
