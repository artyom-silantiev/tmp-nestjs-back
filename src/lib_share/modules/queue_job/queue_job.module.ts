import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { QueueJobExplorer } from './queue_job.explorer';

@Module({
  imports: [DiscoveryModule],
  providers: [],
})
export class QueueJobModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: QueueJobModule,
      providers: [QueueJobExplorer],
    };
  }
}
