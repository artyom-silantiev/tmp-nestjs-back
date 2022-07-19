import { Injectable } from '@nestjs/common';
import { LocalFilesRequest } from '../local_files/local_files_request';
import { ClusterAppType } from '@share/env/env';
import { useRedis } from './redis';
import { UserRole } from '@prisma/client';
import { LocalFileMeta } from '../local_files/local_files-output.service';

@Injectable()
export class CacheService {
  cacheJwtUser = new CacheJwtUser();
  cacheLocalFile = new CacheLocalFile();
  clusterStuff = new ClusterStuff();
}

class CacheJwtUser {
  key(userId: string) {
    return `userJwc:${userId}`;
  }
  async get(userId: string) {
    const cacheKey = this.key(userId);
    const userJwtCache = await useRedis().get(cacheKey);
    return userJwtCache || null;
  }
  async set(
    userId: string,
    jwtUser: {
      userId: string;
      role: UserRole;
    },
  ) {
    const cacheKey = this.key(userId);
    await useRedis().set(cacheKey, JSON.stringify(jwtUser), 'EX', 3600);
  }
}

class CacheLocalFile {
  key(lfReq: LocalFilesRequest) {
    let locaFileCache = 'LocalFile:';
    locaFileCache = lfReq.sha256;
    if (lfReq.thumb) {
      locaFileCache += ':' + lfReq.thumb.name;
    }
    return locaFileCache;
  }
  async get(lfReq: LocalFilesRequest) {
    const cacheKey = this.key(lfReq);
    const localFileCacheKey = await useRedis().get(cacheKey);
    return localFileCacheKey || null;
  }
  async set(lfReq: LocalFilesRequest, localFileMeta: LocalFileMeta) {
    const cacheKey = this.key(lfReq);
    await useRedis().set(cacheKey, JSON.stringify(localFileMeta), 'EX', 300);
  }
}

class ClusterStuff {
  getAppChanName(appUid: string) {
    return `${appUid}@app`;
  }
  getClusterAppPrefix() {
    return `CApp:*`;
  }
  key(appType: ClusterAppType, appUid: string) {
    return `CApp:${appType}:${appUid}`;
  }
  async del(appType: ClusterAppType, appUid: string) {
    const cacheKey = this.key(appType, appUid);
    await useRedis().del(cacheKey);
  }
}
