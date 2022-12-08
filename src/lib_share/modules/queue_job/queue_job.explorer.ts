import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { QUEUE_JOB_DATA } from './queue_job.constants';

type QueueTimerOptions = {
  delayMs: number;
};

@Injectable()
export class QueueJobExplorer implements OnModuleInit {
  private readonly logger = new Logger('QueueJobExplorer');

  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit() {
    this.explore();
  }

  explore() {
    const instanceWrappers: InstanceWrapper[] = [
      ...this.discoveryService.getControllers(),
      ...this.discoveryService.getProviders(),
    ];
    instanceWrappers.forEach((wrapper: InstanceWrapper) => {
      const { instance } = wrapper;
      if (!instance || !Object.getPrototypeOf(instance)) {
        return;
      }
      this.metadataScanner.scanFromPrototype(
        instance,
        Object.getPrototypeOf(instance),
        (key: string) =>
          wrapper.isDependencyTreeStatic()
            ? this.lookupQueueTimer(wrapper, instance, key)
            : this.warnForNonStaticProviders(wrapper, instance, key),
      );
    });
  }

  lookupQueueTimer(
    wrapper: InstanceWrapper<any>,
    instance: Record<string, Function>,
    key: string,
  ) {
    const methodRef = instance[key];
    const options = this.reflector.get(
      QUEUE_JOB_DATA,
      methodRef,
    ) as QueueTimerOptions;

    if (options) {
      this.startQueueTimer(wrapper, instance, key, options);

      this.logger.log(`Queue job registred for "${wrapper.name}@${key}"`);
    }
  }

  warnForNonStaticProviders(
    wrapper: InstanceWrapper<any>,
    instance: Record<string, Function>,
    key: string,
  ) {
    const methodRef = instance[key];
    const options = this.reflector.get(
      QUEUE_JOB_DATA,
      methodRef,
    ) as QueueTimerOptions;

    if (options) {
      this.logger.warn(
        `Cannot register queue job "${wrapper.name}@${key}" because it is defined in a non static provider.`,
      );
    }
  }

  startQueueTimer(
    wrapper: InstanceWrapper<any>,
    instance: Record<string, Function>,
    key: string,
    options: QueueTimerOptions,
  ) {
    const methodRef = instance[key];

    const queueHandle = async () => {
      try {
        await methodRef.apply(instance);
      } catch (error) {
        this.logger.error(`Queue job "${wrapper.name}@${key}" errored: `);
        this.logger.error(error.stack ? error.stack : error);
      }
      setTimeout(queueHandle, options.delayMs);
    };
    setTimeout(queueHandle, 0);
  }
}
