import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { ClusterAppService } from './cluster-app.service';

@Module({
  imports: [RedisModule],
  providers: [ClusterAppService],
  exports: [ClusterAppService],
})
export class ClusterAppModule {}
