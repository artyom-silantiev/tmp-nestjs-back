import { Module } from '@nestjs/common';
import { ClusterAppService } from './cluster-app.service';

@Module({
  imports: [],
  providers: [ClusterAppService],
  exports: [ClusterAppService],
})
export class ClusterAppModule {}
