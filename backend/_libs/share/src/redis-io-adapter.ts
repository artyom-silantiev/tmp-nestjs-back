import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { RedisClient } from 'redis';
import { ServerOptions } from 'socket.io';
import { createAdapter } from 'socket.io-redis';
import { EnvService } from './modules/env/env.service';

export class RedisIoAdapter extends IoAdapter {
  constructor(private app: INestApplication) {
    super(app);
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const env: EnvService = this.app.get(EnvService);
    const pubClient = new RedisClient({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
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
