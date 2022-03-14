import { IpfsModule } from '@share/modules/ipfs/ipfs.module';
import { Module } from '@nestjs/common';
import { EnvModule } from '@share/modules/env/env.module';
import { DbModule } from '@db/db.module';
import { RedisModule } from '@share/modules/redis/redis.module';
import { CommonModule } from '@share/modules/common/common.module';
import { DbFixCommand } from './db-fix.command';
import { ClusterCommand } from './cluster.command';
import { ClusterAppModule } from '@share/modules/cluster-app/cluster-app.module';


import { S3Module } from '@share/modules/s3/s3.module';

@Module({
  imports: [
    CommonModule,
    EnvModule,
    RedisModule,
    DbModule,
    ClusterAppModule,
    S3Module,
    IpfsModule,
  ],
  controllers: [],
  providers: [DbFixCommand, ClusterCommand],
})
export class CliModule {}
