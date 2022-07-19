import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { CacheService } from '../redis/cache.service';
import { EventEmitter } from 'events';
import { ClusterAppType, useEnv } from '@share/env/env';
import { useBs58 } from '@share/bs58';
import { useStdLogger } from '_libs/share/logger';
import { useRedis, useRedisPubSub } from '../redis/redis';

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
  private logger = useStdLogger('ClusterAppService');

  private uid: string;
  private type: ClusterAppType;
  private channelName: string;
  emitter = new EventEmitter();

  constructor(private cache: CacheService) {}

  async initClusterApp(clusterAppType: ClusterAppType) {
    this.uid = this.bs58.uid();
    this.type = clusterAppType;
    await this.initRedisPart();
  }

  private async initRedisPart() {
    const redisClient = useRedis();

    const appKey = this.cache.clusterStuff.key(this.type, this.uid);

    const appInfo = {
      uid: this.uid,
      type: this.type,
      host: this.env.NODE_HOST,
      portHttp: this.env.NODE_PORT,
    } as AppInfo;

    await redisClient.hset(appKey, {
      info: JSON.stringify(appInfo),
      timestamp: Date.now().toString(),
    });
    await redisClient.expire(appKey, 70);

    setInterval(async () => {
      await redisClient.expire(appKey, 70);
      await redisClient.hset(appKey, ['timestamp', Date.now().toString()]);
    }, 1000 * 60);

    const redisSub = useRedisPubSub();
    this.channelName = this.cache.clusterStuff.getAppChanName(this.uid);
    redisSub.subscribe(this.channelName);
    redisSub.on('message', async (channelName: string, message: string) => {
      this.parseRedisMessage(channelName, message);
    });
  }

  getUid() {
    return this.uid;
  }

  getType() {
    return this.type;
  }

  async onModuleDestroy() {
    const redisClient = useRedis();
    await this.cache.clusterStuff.del(this.type, this.uid);
  }

  async getAppInfoByTypeAndUid(appType: ClusterAppType, appUid) {
    const redisClient = useRedis();
    const otherAppKey = this.cache.clusterStuff.key(appType, appUid);

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
    const redisClient = useRedis();

    if (appMessage.type === 'PING') {
      const responseAppMessage = {
        from: this.uid,
        type: 'PONG',
      } as AppMessage;
      const toAppChan = this.cache.clusterStuff.getAppChanName(appMessage.from);
      await redisClient.publish(toAppChan, JSON.stringify(responseAppMessage));
    } else if (appMessage.type === 'PONG') {
      this.emitter.emit('PONG', appMessage);
    }
  }

  async sendPingMessageTo(toAppUid: string) {
    const redisClient = useRedis();
    const responseAppMessage = {
      from: this.uid,
      type: 'PING',
    } as AppMessage;
    const toAppChan = this.cache.clusterStuff.getAppChanName(toAppUid);
    await redisClient.publish(toAppChan, JSON.stringify(responseAppMessage));
  }
}
