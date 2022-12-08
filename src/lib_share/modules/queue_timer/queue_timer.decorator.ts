import { applyDecorators, SetMetadata } from '@nestjs/common';
import { QUEUE_TIMER_DATA } from './queue_timer.constants';

export function QueueTimer(delayMs: number): MethodDecorator {
  return applyDecorators(
    SetMetadata(QUEUE_TIMER_DATA, {
      delayMs,
    }),
  );
}
