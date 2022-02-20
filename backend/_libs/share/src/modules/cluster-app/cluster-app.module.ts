import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { RedisModule } from '../redis/redis.module';
import { ClusterAppService } from './cluster-app.service';

@Module({
  imports: [RedisModule, CommonModule],
  providers: [ClusterAppService],
  exports: [ClusterAppService],
})
export class ClusterAppModule {}
