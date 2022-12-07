import { DynamicModule, Module } from '@nestjs/common';
import { ClusterAppType } from '@share/lib/env/env';
import { ClusterAppService } from './cluster-app.service';
import { APP_CLUSTER_TYPE } from './constans';

@Module({
  imports: [],
  providers: [ClusterAppService],
  exports: [ClusterAppService],
})
export class ClusterAppModule {
  static register(appType: ClusterAppType): DynamicModule {
    return {
      module: ClusterAppModule,
      providers: [
        {
          provide: APP_CLUSTER_TYPE,
          useValue: appType,
        },
        ClusterAppService,
      ],
      exports: [ClusterAppService],
    };
  }
}
