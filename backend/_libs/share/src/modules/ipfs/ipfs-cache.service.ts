import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs-extra';
import { EnvService, NodeEnvType } from '../env/env.service';
import { IpfsObjectService } from '@db/services/ipfs-object.service';
import { StandardResult } from '@share/standard-result.class';
import { IpfsObject } from '@prisma/client';
import { IpfsStorageService } from './ipfs-storage.service';

export interface CacheItemMeta {
  type: 'IMAGE' | 'VIDEO';
  sha256: string;
  mime: string;
  size: number;
  width: number;
  height: number;
  mtime: Date;
  thumbs?: { [thumbName: string]: string };
}

export class CacheItem {
  pathFile: string;
  pathMeta: string;
  meta: CacheItemMeta;

  // processes
  processes = 0;

  // stats
  head = 0; // head count
  get = 0; // get requests count

  constructor(
    pathFile: string,
    pathMeta: string,
    meta: CacheItemMeta,
    private ipfsCacheService: IpfsCacheService,
  ) {
    this.pathFile = pathFile;
    this.pathMeta = pathMeta;
    this.meta = meta;
  }

  getHeaders() {
    return {
      'Cache-Control': 'public, immutable',
      'Content-Type': this.meta.mime,
      'Content-Length': this.meta.size,
      'Last-Modified': new Date(this.meta.mtime).toUTCString(),
      ETag: this.meta.sha256,
    };
  }

  createReadStream() {
    const rs = fs.createReadStream(this.pathFile);
    return rs;
  }

  statsEmitHead() {
    this.head++;
    this.processEnd();
  }

  statsEmitGet() {
    this.get++;
    this.processEnd();
    this.ipfsCacheService.clearCachePass();
  }

  processStart() {
    this.processes += 1;
  }

  processEnd() {
    this.processes -= 1;
  }
}

@Injectable()
export class IpfsCacheService {
  isInit = false;
  items = {} as { [sha256: string]: CacheItem };
  totalItems = 0;
  totalSize = 0;
  clearCacheIsActive = false;
  clearCacheResolves = [] as ((value: unknown) => void)[];

  constructor(
    private env: EnvService,
    private ipfsService: IpfsObjectService,
    private ipfsStorage: IpfsStorageService,
  ) {}

  async init() {
    if (this.isInit) {
      false;
    }

    await fs.mkdirs(this.env.IPFS_CACHE_DIR);
    await this.scanItems();

    this.isInit = true;
  }

  async scanDir(dir) {
    const files = await fs.readdir(dir);
    for (const file of files) {
      const cacheItemPathToFile = path.resolve(dir, file);
      const lstat = await fs.lstat(cacheItemPathToFile);

      if (lstat.isDirectory()) {
        await this.scanDir(path.resolve(dir, file));
      } else if (lstat.isFile()) {
        const cacheItemPathToMeta = path.resolve(dir, file + '.json');

        if (!_.endsWith(file, '.json')) {
          await this.putCacheItemFromFiles(
            cacheItemPathToFile,
            cacheItemPathToMeta,
          );
        }
      }
    }
  }

  async scanItems() {
    await this.scanDir(this.env.IPFS_CACHE_DIR);
  }

  private getCacheItemPaths(sha256: string) {
    const suffix = sha256.substr(0, this.env.IPFS_CACHE_DIR_SUFFIX_LENGTH);
    const cacheItemPathToFile = path.resolve(
      this.env.IPFS_CACHE_DIR,
      suffix,
      sha256,
    );
    const cacheItemPathToMeta = cacheItemPathToFile + '.json';
    return [cacheItemPathToFile, cacheItemPathToMeta];
  }

  private putCacheObject(
    sha256: string,
    pathToFile: string,
    pathToMeta: string,
    metaData: CacheItemMeta,
  ) {
    const cacheItem = new CacheItem(pathToFile, pathToMeta, metaData, this);
    this.items[sha256] = cacheItem;
    this.totalItems++;
    this.totalSize += cacheItem.meta.size;
    return this.items[sha256];
  }

  private async checkPrevDir(pathToFile: string) {
    const prevDirPath = pathToFile.replace(/^(.*)\/\w*$/, '$1');
    await fs.mkdirs(prevDirPath);
  }

  public existsCacheItemBySha256(sha256: string) {
    return !!this.items[sha256];
  }

  private async waitClearCacheComplete() {
    if (this.clearCacheIsActive) {
      return new Promise((resolve) => {
        this.clearCacheResolves.push(resolve);
      });
    }
  }

  async deleteCacheItem(sha256: string): Promise<boolean> {
    const cacheItem = this.items[sha256];

    if (cacheItem) {
      await fs.remove(cacheItem.pathFile);
      await fs.remove(cacheItem.pathMeta);

      this.totalItems--;
      this.totalSize -= cacheItem.meta.size;
      delete this.items[sha256];

      return true;
    }

    return false;
  }

  public async getCacheItemBySha256(sha256: string): Promise<CacheItem | null> {
    await this.waitClearCacheComplete();

    let cacheItem = this.items[sha256];

    if (cacheItem) {
      return cacheItem;
    }

    const [cacheItemPathToFile, cacheItemPathToMeta] =
      this.getCacheItemPaths(sha256);
    cacheItem = await this.putCacheItemFromFiles(
      cacheItemPathToFile,
      cacheItemPathToMeta,
    );

    return cacheItem;
  }

  public getCacheItemBySha256Force(sha256: string): CacheItem | null {
    const cacheItem = this.items[sha256];

    if (cacheItem) {
      return cacheItem;
    }

    return null;
  }

  public async updateMetaFileBySha256(sha256: string) {
    const getIpfsObjectRes = await this.ipfsService.getIpfsObjectBySha256Hash(
      sha256,
    );
    if (getIpfsObjectRes.isBad) {
      return false;
    }
    const ipfsObject = getIpfsObjectRes.data;
    await this.putMetaDataByIpfsObjectAndReturnMetaData(ipfsObject);
    return true;
  }

  private async putCacheItemFromFiles(
    cacheItemPathToFile: string,
    cacheItemPathToMeta: string,
  ): Promise<CacheItem | null> {
    try {
      const metaExists = await fs.stat(cacheItemPathToMeta);

      if (!metaExists || !metaExists.isFile) {
        await fs.remove(cacheItemPathToFile);
        return null;
      }

      const sha256 = cacheItemPathToFile.replace(/^.*\/(.*)$/, '$1');
      const stat = await fs.stat(cacheItemPathToFile);

      const metaData = (await fs.readJSON(
        cacheItemPathToMeta,
      )) as CacheItemMeta;
      if (metaData.size !== stat.size) {
        await fs.remove(cacheItemPathToFile);
        await fs.remove(cacheItemPathToMeta);
        return null;
      }

      return this.putCacheObject(
        sha256,
        cacheItemPathToFile,
        cacheItemPathToMeta,
        metaData,
      );
    } catch (error) {
      return null;
    }
  }

  public async loadCacheItemByIpfsObject(ipfsObject: IpfsObject) {
    const stdRes = new StandardResult<CacheItem>();

    const sha256 = ipfsObject.sha256;
    const [cacheItemPathToFile, cacheItemPathToMeta] =
      this.getCacheItemPaths(sha256);

    await this.checkPrevDir(cacheItemPathToFile);

    const downloadObjectRes =
      await this.ipfsStorage.s3Client.objectDownloadToFile(
        sha256,
        cacheItemPathToFile,
      );
    if (downloadObjectRes.isBad) {
      return stdRes.mergeBad(downloadObjectRes);
    }

    const metaData = await this.putMetaDataByIpfsObjectAndReturnMetaData(
      ipfsObject,
    );

    const cacheItem = this.putCacheObject(
      sha256,
      cacheItemPathToFile,
      cacheItemPathToMeta,
      metaData,
    );
    return stdRes.setData(cacheItem);
  }

  private async putMetaDataByIpfsObjectAndReturnMetaData(
    ipfsObject: IpfsObject,
  ) {
    const [cacheItemPathToFile, cacheItemPathToMeta] = this.getCacheItemPaths(
      ipfsObject.sha256,
    );

    const metaData = {
      type: ipfsObject.type,
      sha256: ipfsObject.sha256,
      size: ipfsObject.size,
      width: ipfsObject.width,
      height: ipfsObject.height,
      mime: ipfsObject.mime,
      mtime: ipfsObject.updatedAt,
    } as CacheItemMeta;

    if (ipfsObject.type === 'IMAGE' && !ipfsObject.isThumb) {
      const thumbs = {} as { [thumbName: string]: string };

      const ipfsObjectThumbs = await this.ipfsService.getThumbs(ipfsObject);
      for (const ipfsObjectThumb of ipfsObjectThumbs) {
        const thumbIpfsObject = await this.ipfsService.getIpfsObjectById(
          ipfsObjectThumb.thumbIpfsObjectId,
        );
        if (!thumbIpfsObject) {
          console.error('no ipfs item for thumb');
          continue;
        }
        thumbs[ipfsObjectThumb.thumbName + ''] = thumbIpfsObject.sha256;
      }

      metaData.thumbs = thumbs;
    }

    try {
      await fs.writeJSON(cacheItemPathToMeta, metaData);
    } catch (error) {
      console.error(new Error('no access to meta file!!!'));
    }

    return metaData;
  }

  private async clearCache() {
    if (this.clearCacheIsActive) {
      return;
    }

    this.clearCacheIsActive = true;
    const timeStart = Date.now();

    try {
      const result = {
        processTime: 0,
        itemsCleared: [],
        preClearCacheStats: {
          totalItems: this.totalItems,
          totalSize: this.totalSize,
        },
        afterClearCacheStats: {
          totalItems: 0,
          totalSize: 0,
        },
      };

      const tempCacheItems = _.clone(this.items);
      let tempTotalItems = this.totalItems;
      let tempTotalSize = this.totalSize;
      const itemsToClear = [];

      while (
        tempTotalItems > this.env.IPFS_CACHE_MAX_ITEMS ||
        tempTotalSize > this.env.IPFS_CACHE_MAX_SIZE
      ) {
        let itemToClearSha256 = null as null | string;
        let itemToClearSize = 0;
        let itemSizeEfficiency = Number.POSITIVE_INFINITY;

        for (const cacheItemKey in tempCacheItems) {
          const cacheItem = tempCacheItems[cacheItemKey];

          if (cacheItem.processes > 0) {
            continue;
          }

          const requests = cacheItem.head + cacheItem.get;
          const size = cacheItem.meta.size;
          const sizeEfficiency = requests * size;

          if (sizeEfficiency < itemSizeEfficiency) {
            itemSizeEfficiency = sizeEfficiency;
            itemToClearSha256 = cacheItemKey;
            itemToClearSize = size;
          }
        }

        if (itemToClearSha256) {
          itemsToClear.push(itemToClearSha256);
          tempTotalItems--;
          tempTotalSize -= itemToClearSize;
          delete tempCacheItems[itemToClearSha256];
        }
      }

      for (const itemToClearSha256 of itemsToClear) {
        await this.deleteCacheItem(itemToClearSha256);
        result.itemsCleared.push(itemToClearSha256);
      }

      result.afterClearCacheStats = {
        totalItems: this.totalItems,
        totalSize: this.totalSize,
      };
      result.processTime = Date.now() - timeStart;
      this.clearCacheIsActive = false;

      while (this.clearCacheResolves.length) {
        const resolve = this.clearCacheResolves.splice(0, 1);
        if (resolve.length) {
          resolve[0](1);
        }
      }

      if (this.env.NODE_ENV === NodeEnvType.development) {
        console.log('clear cache result', result);
      }

      return result;
    } catch (error) {
      this.clearCacheIsActive = false;
      throw error;
    }
  }

  clearCachePass() {
    if (
      !this.clearCacheIsActive &&
      (this.totalItems > this.env.IPFS_CACHE_MAX_ITEMS ||
        this.totalSize > this.env.IPFS_CACHE_MAX_SIZE)
    ) {
      void this.clearCache();
    }
  }

  public dumpCacheItemsStats() {
    for (const cacheItemKey in this.items) {
      const cacheItem = this.items[cacheItemKey];
      cacheItem.head = Math.floor(cacheItem.head / 2);
      cacheItem.get = Math.floor(cacheItem.get / 2);
    }
  }
}
