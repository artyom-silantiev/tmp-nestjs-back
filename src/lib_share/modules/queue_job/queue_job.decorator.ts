import { applyDecorators, SetMetadata } from '@nestjs/common';
import { QUEUE_JOB_DATA } from './queue_job.constants';

export function QueueJob(delayMs: number): MethodDecorator {
  return applyDecorators(
    SetMetadata(QUEUE_JOB_DATA, {
      delayMs,
    }),
  );
}
