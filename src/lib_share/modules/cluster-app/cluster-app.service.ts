import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { EventEmitter } from 'events';
import { ClusterAppType, useEnv } from '@share/lib/env/env';
import { useBs58 } from '@share/lib/bs58';
import { Logger } from '@share/logger';
import { useRedis, useRedisPubSub } from '../../lib/redis';
import { useClusterStuff } from '@share/lib/cache/cluster-stuff';
import { APP_CLUSTER_TYPE } from './constans';

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
export class ClusterAppService implements OnModuleDestroy, OnModuleInit {
  private env = useEnv();
  private bs58 = useBs58();
  private clusterStuff = useClusterStuff();
  private logger = new Logger('ClusterAppService');

  private uid: string;
  private type: ClusterAppType;
  private channelName: string;
  emitter = new EventEmitter();

  constructor(
    @Inject(APP_CLUSTER_TYPE) private clusterAppType: ClusterAppType,
  ) {
    this.uid = this.bs58.uid();
    this.type = clusterAppType;
  }

  async onModuleInit() {
    await this.initRedisPart();
  }

  async onModuleDestroy() {
    await this.clusterStuff.del(this.type, this.uid);
  }

  private async initRedisPart() {
    const redisClient = useRedis();

    const appKey = this.clusterStuff.key(this.type, this.uid);

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
    this.channelName = this.clusterStuff.getAppChanName(this.uid);
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

  async getAppInfoByTypeAndUid(appType: ClusterAppType, appUid) {
    const redisClient = useRedis();
    const otherAppKey = this.clusterStuff.key(appType, appUid);

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
      const toAppChan = this.clusterStuff.getAppChanName(appMessage.from);
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
    const toAppChan = this.clusterStuff.getAppChanName(toAppUid);
    await redisClient.publish(toAppChan, JSON.stringify(responseAppMessage));
  }
}
