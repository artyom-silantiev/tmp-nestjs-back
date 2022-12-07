import { INestApplication } from '@nestjs/common';
import { RedisIoAdapter } from './redis-io-adapter';

export async function appUseRedisAdapter(app: INestApplication) {
  app.useWebSocketAdapter(new RedisIoAdapter(app));
}
