import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as sharp from 'sharp';
import { ThumbParam } from './ipfs_request';
import { StandardResult } from '@share/standard-result.class';
import { CacheItem, IpfsCacheService } from './ipfs-cache.service';
import { IpfsObjectService } from '@db/services/ipfs-object.service';
import { IpfsObject, MediaType } from '@prisma/client';
import { IpfsStorageService } from './ipfs-storage.service';
import { PrismaService } from '@db/prisma.service';
import { IpfsOutputService } from './ipfs-output.service';
import { getMediaContentProbe } from '@share/ffmpeg';
import { getMimeFromPath, getFileSha256 } from '@share/helpers';
import { useEnv } from '@share/lib/env/env';
import { useBs58 } from '@share/lib/bs58';

@Injectable()
export class IpfsMakeService {
  private env = useEnv();
  private bs58 = useBs58();

  constructor(
    private prisma: PrismaService,
    private ipfsService: IpfsObjectService,
    private ipfsCache: IpfsCacheService,
    private ipfsStorage: IpfsStorageService,
    private ipfsOutput: IpfsOutputService,
  ) {}

  public async createIpfsObjectFromFile(
    tempFile: string,
    params?: {
      thumbData?: {
        orgIpfsId: bigint;
        name: string;
      };
      noValidation?: boolean;
    },
  ) {
    const stdRes = new StandardResult<IpfsObject>(201);
    const fileSha256Hash = await getFileSha256(tempFile);

    const getIpfsObjRes = await this.ipfsService.getIpfsObjectBySha256Hash(
      fileSha256Hash,
    );
    if (getIpfsObjRes.isGood) {
      await fs.remove(tempFile);
      return stdRes.setCode(208).setData(getIpfsObjRes.data);
    }

    const mime = await getMimeFromPath(tempFile);
    const fstat = await fs.stat(tempFile);

    let contentType: MediaType;
    if (_.startsWith(mime, 'image/')) {
      contentType = MediaType.IMAGE;
    } else if (_.startsWith(mime, 'audio/')) {
      contentType = MediaType.AUDIO;
    } else if (_.startsWith(mime, 'video/')) {
      contentType = MediaType.VIDEO;
    }

    let size,
      width = null,
      height = null,
      duration = null,
      frameRate = 0;

    if (contentType === MediaType.IMAGE) {
      const imageInfo = await sharp(tempFile).metadata();
      size = fstat.size;
      width = imageInfo.width;
      height = imageInfo.height;
    } else if (contentType === MediaType.AUDIO) {
      const fileProbe = await getMediaContentProbe(tempFile);
      const stream = fileProbe.audioStreams[0];

      size = fileProbe.format.size;
      duration = parseFloat(stream.duration);
    } else if (contentType === MediaType.VIDEO) {
      const fileProbe = await getMediaContentProbe(tempFile);
      const stream = fileProbe.videoStreams[0];

      size = fileProbe.format.size;
      width = stream.width;
      height = stream.height;
      duration = parseFloat(stream.duration);
      frameRate = parseFloat(stream.r_frame_rate);
    }

    if (!params || !params.noValidation) {
    }

    if (params && params.thumbData) {
      if (contentType !== MediaType.IMAGE) {
        return stdRes
          .setCode(500)
          .setErrData('bad org content type for create thumb');
      }
    }

    const objectUploadRes = await this.ipfsStorage.s3Client.objectUpload(
      tempFile,
      fileSha256Hash,
    );
    if (objectUploadRes.isBad) {
      return stdRes.mergeBad(objectUploadRes);
    }

    await fs.remove(tempFile);

    let ipfsObject: IpfsObject;
    if (params && params.thumbData) {
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

  async createNewThumbForCacheItem(
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
      this.bs58.uid() + '.thumb.jpg',
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

    const getNewThumbCacheItem = await this.ipfsOutput.getCacheItemBySha256(
      createThumbIpfsObjectRes.data.sha256,
    );
    if (getNewThumbCacheItem.isBad) {
      return stdRes.mergeBad(getNewThumbCacheItem);
    }

    stdRes.mergeGood(getNewThumbCacheItem);

    return stdRes;
  }
}
