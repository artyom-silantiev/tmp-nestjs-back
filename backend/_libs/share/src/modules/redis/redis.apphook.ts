import { INestApplication } from '@nestjs/common';
import { RedisIoAdapter } from './redis-io-adapter';
import { RedisModule } from './redis.module';
import { RedisService } from './redis.service';

export async function useRedis(
  app: INestApplication,
  options?: {
    withIOAdapter?: boolean;
  },
) {
  options = options || {};

  const redis = app.select(RedisModule).get(RedisService);
  await redis.init();

  app.useWebSocketAdapter(new RedisIoAdapter(app));
}
