import { DynamicModule, Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { QueueTimerExplorer } from './queue_timer.explorer';

@Module({
  imports: [DiscoveryModule],
  providers: [],
})
export class QueueTimerModule {
  static forRoot(): DynamicModule {
    return {
      global: true,
      module: QueueTimerModule,
      providers: [QueueTimerExplorer],
    };
  }
}
