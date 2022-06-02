import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { EventEmitter } from 'events';
import { ClusterAppType, useEnv } from '@share/env/env';
import { useBs58 } from '@share/bs58';

export type AppMessage = {
  from: string;
  type: 'PING' | 'PONG';
};

export type AppInfo = {
  uid: string;
  type: ClusterAppType;
  host: string;
  portHttp: number;
};

@Injectable()
export class ClusterAppService implements OnModuleDestroy {
  private env = useEnv();
  private bs58 = useBs58();
  private logger = new Logger('ClusterAppService');

  private uid: string;
  private type: ClusterAppType;
  private channelName: string;
  emitter = new EventEmitter();

  constructor(private redis: RedisService) {}

  async initClusterApp(clusterAppType: ClusterAppType) {
    this.uid = this.bs58.uuid();
    this.type = clusterAppType;
    await this.initRedisPart();
  }

  private async initRedisPart() {
    await this.redis.init();

    const redisClient = this.redis.getClient();

    const appKey = this.redis.keys.getClusterAppKey(this.type, this.uid);

    const appInfo = {
      uid: this.uid,
      type: this.type,
      host: this.env.NODE_HOST,
      portHttp: this.env.NODE_PORT,
    } as AppInfo;

    await redisClient.hset(appKey, ['info', JSON.stringify(appInfo)]);
    await redisClient.hset(appKey, ['timestamp', Date.now().toString()]);
    await redisClient.expire(appKey, 70);

    setInterval(async () => {
      await redisClient.expire(appKey, 70);
      await redisClient.hset(appKey, ['timestamp', Date.now().toString()]);
    }, 1000 * 60);

    const redisSub = this.redis.getClientSub();
    this.channelName = this.redis.keys.getAppChanName(this.uid);
    redisSub.subscribe(this.channelName);
    redisSub.nodeRedis.on(
      'message',
      async (channelName: string, message: string) => {
        this.parseRedisMessage(channelName, message);
      },
    );
  }

  getUid() {
    return this.uid;
  }

  getType() {
    return this.type;
  }

  async onModuleDestroy() {
    const redisClient = this.redis.getClient();
    const appKey = this.redis.keys.getClusterAppKey(this.type, this.uid);
    await redisClient.del(appKey);
  }

  async getAppInfoByTypeAndUid(appType: ClusterAppType, appUid) {
    const redisClient = this.redis.getClient();
    const otherAppKey = this.redis.keys.getClusterAppKey(appType, appUid);

    const appInfoRaw = await redisClient.hget(otherAppKey, 'info');
    const appInfo = JSON.parse(appInfoRaw) as AppInfo;

    if (!appInfo) {
      return null;
    }

    return appInfo;
  }

  private async parseRedisMessage(channelName: string, message: string) {
    if (channelName !== this.channelName) {
      return;
    }
    const appMessage = JSON.parse(message) as AppMessage;
    const redisClient = this.redis.getClient();

    if (appMessage.type === 'PING') {
      const responseAppMessage = {
        from: this.uid,
        type: 'PONG',
      } as AppMessage;
      const toAppChan = this.redis.keys.getAppChanName(appMessage.from);
      await redisClient.publish(toAppChan, JSON.stringify(responseAppMessage));
    } else if (appMessage.type === 'PONG') {
      this.emitter.emit('PONG', appMessage);
    }
  }

  async sendPingMessageTo(toAppUid: string) {
    const redisClient = this.redis.getClient();
    const responseAppMessage = {
      from: this.uid,
      type: 'PING',
    } as AppMessage;
    const toAppChan = this.redis.keys.getAppChanName(toAppUid);
    await redisClient.publish(toAppChan, JSON.stringify(responseAppMessage));
  }
}
