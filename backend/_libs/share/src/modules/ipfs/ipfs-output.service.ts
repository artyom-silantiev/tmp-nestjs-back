import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as sharp from 'sharp';
import IpfsRequest, { ThumbParam } from './ipfs_request';
import { StandardResult } from '@share/standard-result.class';
import { CacheItem, IpfsCacheService } from './ipfs-cache.service';
import { IpfsObjectService } from '@db/services/ipfs-object.service';
import { EnvService } from '../env/env.service';
import { Bs58Service } from '@share/modules/common/bs58.service';
import { IpfsObject, MediaType } from '@prisma/client';
import { IpfsStorageService } from './ipfs-storage.service';
import { HelpersService } from '@share/modules/common/helpers.service';
import { FFmpegService } from '@share/services/ffmpeg.service';
import { PrismaService } from '@db/prisma.service';

@Injectable()
export class IpfsOutputService {
  constructor(
    private env: EnvService,
    private helpers: HelpersService,
    private ffmpeg: FFmpegService,
    private bs58: Bs58Service,
    private prisma: PrismaService,
    private ipfsService: IpfsObjectService,
    private ipfsCache: IpfsCacheService,
    private ipfsStorage: IpfsStorageService,
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

      cacheItem.processEnd();
      const thumbSha256 = cacheItem.meta.thumbs[thumb.name];

      if (thumbSha256) {
        const getThubCacheItemRes = await this.getCacheItemBySha256(
          thumbSha256,
        );
        if (getThubCacheItemRes.isGood) {
          return stdRes.mergeGood(getThubCacheItemRes);
        }
      }

      const createNewThumbRes = await this.createNewThumbForCacheItem(
        cacheItem,
        thumb,
      );
      if (createNewThumbRes.isBad) {
        return stdRes.mergeBad(createNewThumbRes);
      }

      return stdRes.mergeGood(createNewThumbRes);
    }

    stdRes.setData(cacheItem);

    return stdRes;
  }

  public async createIpfsObjectFromFile(
    filePath: string,
    params?: {
      thumbData?: {
        orgIpfsId: bigint;
        name: string;
      };
      noValidation?: boolean;
    },
  ) {
    const stdRes = new StandardResult<IpfsObject>(201);
    const fileSha256Hash = await this.helpers.getFileSha256(filePath);

    const getIpfsObjRes = await this.ipfsService.getIpfsObjectBySha256Hash(
      fileSha256Hash,
    );
    if (getIpfsObjRes.isGood) {
      await fs.remove(filePath);
      return stdRes.setCode(208).setData(getIpfsObjRes.data);
    }

    const fileInfo = await this.helpers.getFileInfo(filePath);
    const mime = fileInfo.mime;
    const contentType = _.startsWith(mime, 'image/')
      ? MediaType.IMAGE
      : MediaType.VIDEO;
    const fstat = await fs.stat(filePath);

    let size,
      width,
      height,
      duration = null,
      frameRate = 0;
    if (contentType === MediaType.IMAGE) {
      const imageInfo = await sharp(filePath).metadata();
      size = fstat.size;
      width = imageInfo.width;
      height = imageInfo.height;
    } else {
      const fileProbe = await this.ffmpeg.getMediaContentProbe(filePath);
      const stream = fileProbe.videoStreams[0];

      size = fileProbe.format.size;
      width = stream.width;
      height = stream.height;
      duration = parseFloat(stream.duration);
      frameRate = parseFloat(stream.r_frame_rate);
    }

    if (!params || !params.noValidation) {
    }

    const objectUploadRes = await this.ipfsStorage.s3Client.objectUpload(
      filePath,
      fileSha256Hash,
    );
    if (objectUploadRes.isBad) {
      return stdRes.mergeBad(objectUploadRes);
    }

    await fs.remove(filePath);

    let ipfsObject: IpfsObject;
    if (params && params.thumbData) {
      if (contentType !== MediaType.IMAGE) {
        return stdRes
          .setCode(500)
          .setErrData('bad org content type for create thumb');
      }

      const thumbIpfsObject = await this.prisma.ipfsObject.create({
        data: {
          sha256: fileSha256Hash,
          mime,
          size,
          width,
          height,
          type: contentType,
          isThumb: true,
        },
      });

      await this.prisma.ipfsObjectThumb.create({
        data: {
          orgIpfsObjectId: params.thumbData.orgIpfsId,
          thumbIpfsObjectId: thumbIpfsObject.id,
          thumbName: params.thumbData.name,
        },
      });

      ipfsObject = thumbIpfsObject;
    } else {
      ipfsObject = await this.prisma.ipfsObject.create({
        data: {
          sha256: fileSha256Hash,
          mime,
          size,
          width,
          height,
          type: contentType,
        },
      });
    }

    stdRes.setData(ipfsObject);
    return stdRes;
  }

  private async createNewThumbForCacheItem(
    orgCacheItem: CacheItem,
    thumb: ThumbParam,
  ): Promise<StandardResult<CacheItem>> {
    const stdRes = new StandardResult<CacheItem>(201);

    const orgSha256 = orgCacheItem.meta.sha256;
    const getOrgIpfsObjectRes =
      await this.ipfsService.getIpfsObjectBySha256Hash(orgSha256);
    if (getOrgIpfsObjectRes.isBad) {
      return stdRes.setCode(404).setErrData('');
    }

    const tempNewThumbImageFile = path.resolve(
      this.env.DIR_TEMP_FILES,
      this.bs58.uuid() + '.thumb.jpg',
    );
    const image = sharp(orgCacheItem.pathFile);
    const metadata = await image.metadata();

    if (thumb.type === 'width') {
      await image
        .resize(parseInt(thumb.name))
        .jpeg({ quality: 50 })
        .toFile(tempNewThumbImageFile);
    } else if (thumb.type === 'name') {
      if (thumb.name === 'fullhd') {
        if (metadata.height > metadata.width) {
          await image
            .resize({ height: 1920 })
            .jpeg({ quality: 50 })
            .toFile(tempNewThumbImageFile);
        } else {
          await image
            .resize({ width: 1920 })
            .jpeg({ quality: 50 })
            .toFile(tempNewThumbImageFile);
        }
      }
    }

    const createThumbIpfsObjectRes = await this.createIpfsObjectFromFile(
      tempNewThumbImageFile,
      {
        thumbData: {
          orgIpfsId: getOrgIpfsObjectRes.data.id,
          name: thumb.name,
        },
        noValidation: true,
      },
    );
    if (createThumbIpfsObjectRes.isBad) {
      return stdRes.mergeBad(createThumbIpfsObjectRes);
    }

    await fs.remove(tempNewThumbImageFile);

    orgCacheItem.meta.thumbs[thumb.name] = createThumbIpfsObjectRes.data.sha256;

    await this.ipfsCache.updateMetaFileBySha256(orgSha256);

    const getNewThumbCacheItem = await this.getCacheItemBySha256(
      createThumbIpfsObjectRes.data.sha256,
    );
    if (getNewThumbCacheItem.isBad) {
      return stdRes.mergeBad(getNewThumbCacheItem);
    }

    stdRes.mergeGood(getNewThumbCacheItem);

    return stdRes;
  }
}
