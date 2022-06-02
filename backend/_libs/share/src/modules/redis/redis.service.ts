import { Injectable } from '@nestjs/common';
import { createNodeRedisClient, WrappedNodeRedisClient } from 'handy-redis';
import { LocalFilesRequest } from '../local_files/local_files_request';
import { ClusterAppType, useEnv } from '@share/env/env';

@Injectable()
export class RedisService {
  private env = useEnv();
  protected defaultClient: WrappedNodeRedisClient;
  protected defaultClientSub: WrappedNodeRedisClient;
  protected clients: { [key: string]: WrappedNodeRedisClient } = {};

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
    getJwtUserCacheKey(userId: string) {
      return `userJwc:${userId}`;
    },
    getAppChanName(appUid: string) {
      return `${appUid}@app`;
    },
    getClusterAppPrefix() {
      return `CApp:*`;
    },
    getClusterAppKey(appType: ClusterAppType, appUid: string) {
      return `CApp:${appType}:${appUid}`;
    },
    getLocalFileCachKey(lfReq: LocalFilesRequest) {
      let locaFileCache = 'LocalFile:';
      locaFileCache = lfReq.sha256;
      if (lfReq.thumb) {
        locaFileCache += ':' + lfReq.thumb.name;
      }
      return locaFileCache;
    },
  };
}
