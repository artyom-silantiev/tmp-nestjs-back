import { Injectable } from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { LocalFile, MediaType } from '@prisma/client';
import { StandardResult } from '@share/standard-result.class';

import * as moment from 'moment';
import * as _ from 'lodash';
import * as path from 'path';
import * as sharp from 'sharp';
import * as fs from 'fs-extra';
import { LocalFileService } from '@db/services/local-file.service';
import { PrismaService } from '@db/prisma.service';
import { ThumbParam } from './local_files_request';
import { getMediaContentProbe } from '@share/ffmpeg';
import { Bs58 } from '@share/bs58';
import { getFileInfo, getFileSha256 } from '@share/helpers';

@Injectable()
export class LocalFilesMakeService {
  constructor(
    private env: EnvService,
    private prisma: PrismaService,
    private localFileService: LocalFileService,
  ) {}

  async createLocalFileByFile(
    tempFile: string,
    params?: {
      thumbData?: {
        orgLocalFileId: bigint;
        name: string;
      };
      noValidation?: boolean;
    },
  ) {
    const stdRes = new StandardResult<LocalFile>();
    const fileSha256Hash = await getFileSha256(tempFile);

    const getLocalFileRes =
      await this.localFileService.getLocalFileBySha256Hash(fileSha256Hash);
    if (getLocalFileRes.isGood) {
      await fs.remove(tempFile);
      return stdRes.setCode(208).setData(getLocalFileRes.data);
    }

    const fileInfo = await getFileInfo(tempFile);
    const mime = fileInfo.mime;
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
        await fs.remove(tempFile);
        return stdRes
          .setCode(500)
          .setErrData('bad org content type for create thumb');
      }
    }

    const now = moment();
    const year = now.format('YYYY');
    const month = now.format('MM');
    const day = now.format('DD');
    const locaFiles = this.env.DIR_LOCAL_FILES;
    const locDirForFile = path.join(year, month, day);
    const absDirForFile = path.resolve(locaFiles, locDirForFile);
    const locPathToFile = path.join(locDirForFile, fileSha256Hash);
    const absPathToFile = path.resolve(absDirForFile, fileSha256Hash);
    await fs.mkdirs(absDirForFile);
    await fs.move(tempFile, absPathToFile);
    await fs.remove(tempFile);

    let localFile: LocalFile;
    if (params && params.thumbData) {
      const thumbLocalFile = await this.prisma.localFile.create({
        data: {
          sha256: fileSha256Hash,
          mime,
          size,
          width,
          height,
          durationSec: Math.floor(duration),
          pathToFile: locPathToFile,
          type: contentType,
          isThumb: true,
        },
      });

      await this.prisma.localFileThumb.create({
        data: {
          orgLocalFileId: params.thumbData.orgLocalFileId,
          thumbLocalFileId: thumbLocalFile.id,
          thumbName: params.thumbData.name,
        },
      });

      localFile = thumbLocalFile;
    } else {
      localFile = await this.prisma.localFile.create({
        data: {
          sha256: fileSha256Hash,
          mime,
          size,
          width,
          height,
          durationSec: Math.floor(duration),
          pathToFile: locPathToFile,
          type: contentType,
        },
      });
    }

    stdRes.setData(localFile);
    return stdRes;
  }

  async createNewThumbForLocalFile(
    orgLocalFile: LocalFile,
    thumb: ThumbParam,
  ): Promise<StandardResult<LocalFile>> {
    const stdRes = new StandardResult<LocalFile>(201);

    const tempNewThumbImageFile = path.resolve(
      this.env.DIR_TEMP_FILES,
      Bs58.uuid() + '.thumb.jpg',
    );
    const image = sharp(orgLocalFile.pathToFile);
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

    const createThumbLocalFileRes = await this.createLocalFileByFile(
      tempNewThumbImageFile,
      {
        thumbData: {
          orgLocalFileId: orgLocalFile.id,
          name: thumb.name,
        },
        noValidation: true,
      },
    );
    if (createThumbLocalFileRes.isBad) {
      return stdRes.mergeBad(createThumbLocalFileRes);
    }

    await fs.remove(tempNewThumbImageFile);

    stdRes.mergeGood(createThumbLocalFileRes);

    return stdRes;
  }
}
