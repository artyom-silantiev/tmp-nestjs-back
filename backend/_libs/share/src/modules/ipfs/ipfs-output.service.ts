import { forwardRef, Inject, Injectable } from '@nestjs/common';
import * as _ from 'lodash';
import IpfsRequest, { ThumbParam } from './ipfs_request';
import { StandardResult } from '@share/standard-result.class';
import { CacheItem, IpfsCacheService } from './ipfs-cache.service';
import { IpfsObjectService } from '@db/services/ipfs-object.service';
import { IpfsMakeService } from './ipfs-make.service';
import { useEnv } from '@share/env/env';

@Injectable()
export class IpfsOutputService {
  private env = useEnv();

  constructor(
    private ipfsService: IpfsObjectService,
    private ipfsCache: IpfsCacheService,
    @Inject(forwardRef(() => IpfsMakeService))
    private ipfsMake: IpfsMakeService,
  ) {}

  async getIpfsCacheItemByIpfsRequest(ipfsRequest: IpfsRequest) {
    const res = await this.getCacheItem(ipfsRequest);
    return res;
  }

  public async getCacheItemBySha256(sha256: string) {
    const stdRes = new StandardResult<CacheItem>();

    const orgCacheItem = await this.ipfsCache.getCacheItemBySha256(sha256);

    if (orgCacheItem) {
      stdRes.setData(orgCacheItem);
    } else {
      const getIpfsObjectRes = await this.ipfsService.getIpfsObjectBySha256Hash(
        sha256,
      );
      if (getIpfsObjectRes.isBad) {
        return stdRes.mergeBad(getIpfsObjectRes);
      }

      const loadCacheItemRes = await this.ipfsCache.loadCacheItemByIpfsObject(
        getIpfsObjectRes.data,
      );
      if (loadCacheItemRes.isBad) {
        return stdRes.mergeBad(loadCacheItemRes);
      }

      stdRes.mergeGood(loadCacheItemRes);
    }

    stdRes.data.processStart();

    return stdRes;
  }

  public async getCacheItem(
    ipfsRequest: IpfsRequest,
  ): Promise<StandardResult<CacheItem>> {
    let cacheItem = null as CacheItem | null;
    const stdRes = new StandardResult<CacheItem>();
    const sha256 = ipfsRequest.sha256;

    const getCacheItemRes = await this.getCacheItemBySha256(sha256);
    if (getCacheItemRes.isBad) {
      return stdRes.mergeBad(getCacheItemRes);
    }
    cacheItem = getCacheItemRes.data;

    if (ipfsRequest.type) {
      if (ipfsRequest.type === 'image' && cacheItem.meta.type !== 'IMAGE') {
        return stdRes.setCode(404).setErrData('not found');
      } else if (
        ipfsRequest.type === 'video' &&
        cacheItem.meta.type !== 'VIDEO'
      ) {
        return stdRes.setCode(404).setErrData('not found');
      }
    }

    if (ipfsRequest.thumb && cacheItem.meta.thumbs) {
      if (cacheItem.meta.type !== 'IMAGE') {
        cacheItem.processEnd();
        return stdRes
          .setCode(406)
          .setErrData('thumbs size param for not thumbs allow object');
      }

      const thumb = ipfsRequest.thumb;
      if (thumb.type === 'width') {
        thumb.name = IpfsRequest.parseThumbSize(
          parseInt(thumb.name),
          cacheItem.meta.width,
          this.env.IPFS_CACHE_MIN_THUMB_LOG_SIZE,
        );
      } else if (thumb.type === 'name') {
        if (thumb.name === 'fullhd') {
          if (cacheItem.meta.width >= 1920 || cacheItem.meta.height >= 1920) {
            // noting
          } else {
            return stdRes.setData(cacheItem);
          }
        }
      }

      const thumbSha256 = cacheItem.meta.thumbs[thumb.name];

      if (thumbSha256) {
        const getThubCacheItemRes = await this.getCacheItemBySha256(
          thumbSha256,
        );
        cacheItem.processEnd();
        if (getThubCacheItemRes.isGood) {
          return stdRes.mergeGood(getThubCacheItemRes);
        }
      }

      const createNewThumbRes = await this.ipfsMake.createNewThumbForCacheItem(
        cacheItem,
        thumb,
      );
      cacheItem.processEnd();
      if (createNewThumbRes.isBad) {
        return stdRes.mergeBad(createNewThumbRes);
      }

      return stdRes.mergeGood(createNewThumbRes);
    }

    stdRes.setData(cacheItem);

    return stdRes;
  }
}
