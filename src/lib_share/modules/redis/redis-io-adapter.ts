import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { useEnv } from '@share/lib/env/env';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';
import { createAdapter } from 'socket.io-redis';

export class RedisIoAdapter extends IoAdapter {
  constructor(private app: INestApplication) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const env = useEnv();

    const redisUrl = `redis://${env.REDIS_HOST}:${env.REDIS_PORT}`;

    const pubClient = createClient({
      url: redisUrl,
      database: env.REDIS_DB + 1,
    });
    const subClient = pubClient.duplicate();
    const redisAdapter = createAdapter({ pubClient, subClient });

    const server = super.createIOServer(port, {
      ...options,
      cors: true,
    });
    server.adapter(redisAdapter);
    return server;
  }
}
