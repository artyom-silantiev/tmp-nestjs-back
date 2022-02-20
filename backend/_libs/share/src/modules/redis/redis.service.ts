import { Injectable, OnModuleInit } from '@nestjs/common';
import { createNodeRedisClient, WrappedNodeRedisClient } from 'handy-redis';
import { ClusterAppType } from '../cluster-app/cluster-app.types';
import { EnvService } from '../env/env.service';

@Injectable()
export class RedisService {
  protected defaultClient: WrappedNodeRedisClient;
  protected defaultClientSub: WrappedNodeRedisClient;
  protected clients: { [key: string]: WrappedNodeRedisClient } = {};

  constructor(private env: EnvService) {}

  public init() {
    if (this.defaultClient) {
      this.defaultClient.quit();
    }
    this.defaultClient = this.createClient();
    this.defaultClient.select(this.env.REDIS_DB);

    if (this.defaultClientSub) {
      this.defaultClientSub.quit();
    }
    this.defaultClientSub = this.createClient();
    this.defaultClientSub.select(this.env.REDIS_DB);

    return this;
  }

  protected createClient() {
    const newClient = createNodeRedisClient(
      this.env.REDIS_PORT,
      this.env.REDIS_HOST,
    );
    newClient.select(this.env.REDIS_DB);
    return newClient;
  }

  public getClient() {
    return this.defaultClient;
  }

  public getClientSub() {
    return this.defaultClientSub;
  }

  public async getClientByName(name: string) {
    if (this.clients[name]) {
      return this.clients[name];
    } else {
      this.clients[name] = await this.createClient();
      return this.clients[name];
    }
  }

  keys = {
    getAppChanName(appUid: string) {
      return `${appUid}@app`;
    },
    getClusterAppPrefix() {
      return `CApp:*`;
    },
    getClusterAppKey(appType: ClusterAppType, appUid: string) {
      return `CApp:${appType}:${appUid}`;
    },
    getJwtUserCacheKey(userId: string) {
      return `jwtUser:${userId}`;
    },
    getPlayerEntityCacheKey(entityCode: string) {
      return `playerEntity:${entityCode}`;
    },
    getFastGeoCacheKey(geoKey: string) {
      return `fastGeoCache:${geoKey}`;
    },
    getPlayerMediaInfoCacheKey(mediaEntityCode: string) {
      return `playerMediaInfo:${mediaEntityCode}`;
    },
    getPlayerStatsDumpsHKey() {
      return 'playerStatsDumps';
    },
    getStatsPeriodOfDayKey(dayDate: string) {
      // dayDate example: 2022-01-22
      return `statsPeriodOfDay:${dayDate}`;
    },
    getGeoCityCacheKey(cityId: string) {
      return `geoCityView:${cityId}`;
    },
    getGeoCountryCacheKey(cityId: string) {
      return `geoCountryView:${cityId}`;
    },
    getUserCacheKey(userId: string) {
      return `geoUserView:${userId}`;
    },
  };
}
