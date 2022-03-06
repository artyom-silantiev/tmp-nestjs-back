import { INestApplicationContext } from '@nestjs/common';
import { ClusterAppType } from '../env/env.service';
import { ClusterAppModule } from './cluster-app.module';
import { ClusterAppService } from './cluster-app.service';

export async function useClusterApp(
  appContext: INestApplicationContext,
  appType: ClusterAppType,
) {
  const clusterApp = appContext.select(ClusterAppModule).get(ClusterAppService);
  await clusterApp.initClusterApp(appType);
}