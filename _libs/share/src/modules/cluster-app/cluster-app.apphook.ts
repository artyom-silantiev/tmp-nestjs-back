import { INestApplicationContext } from '@nestjs/common';
import { ClusterAppType } from '@share/composables/env/env';
import { ClusterAppModule } from './cluster-app.module';
import { ClusterAppService } from './cluster-app.service';

export async function appUseClusterApp(
  appContext: INestApplicationContext,
  appType: ClusterAppType,
) {
  const clusterApp = appContext.select(ClusterAppModule).get(ClusterAppService);
  await clusterApp.initClusterApp(appType);
}
