import { INestApplication } from '@nestjs/common';
import { RedisIoAdapter } from './redis-io-adapter';

export async function appUseRedis(
  app: INestApplication,
  options?: {
    withIOAdapter?: boolean;
  },
) {
  options = options || {};
  if (options.withIOAdapter) {
    app.useWebSocketAdapter(new RedisIoAdapter(app));
  }
}
