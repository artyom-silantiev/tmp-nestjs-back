import { CommandModule } from 'nestjs-command';
import { IpfsModule } from '@share/modules/ipfs/ipfs.module';
import { Module } from '@nestjs/common';
import { DbModule } from '@db/db.module';
import { DbFixCommand } from './db-fix.command';
import { ClusterCommand } from './cluster.command';
import { ClusterAppModule } from '@share/modules/cluster-app/cluster-app.module';
import { S3Module } from '@share/modules/s3/s3.module';
import { SeederCommand } from './seeder.command';

@Module({
  imports: [CommandModule, DbModule, ClusterAppModule, S3Module, IpfsModule],
  controllers: [],
  providers: [SeederCommand, DbFixCommand, ClusterCommand],
})
export class CliModule {}
