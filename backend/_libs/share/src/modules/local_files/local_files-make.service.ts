import { Injectable } from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { Bs58Service } from '@share/modules/common/bs58.service';
import { LocalFile, MediaType } from '@prisma/client';
import { StandardResult } from '@share/standard-result.class';

import * as moment from 'moment';
import * as _ from 'lodash';
import * as path from 'path';
import * as sharp from 'sharp';
import * as fs from 'fs-extra';
import { HelpersService } from '../common/helpers.service';
import { LocalFileService } from '@db/services/local-file.service';
import { FFmpegService } from '@share/services/ffmpeg.service';
import { PrismaService } from '@db/prisma.service';

@Injectable()
export class LocalFilesMakeService {
  constructor(
    private env: EnvService,
    private bs58: Bs58Service,
    private prisma: PrismaService,
    private ffmpeg: FFmpegService,
    private helpers: HelpersService,
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
    const fileSha256Hash = await this.helpers.getFileSha256(tempFile);

    const getLocalFileRes =
      await this.localFileService.getLocalFileBySha256Hash(fileSha256Hash);
    if (getLocalFileRes.isGood) {
      await fs.remove(tempFile);
      return stdRes.setCode(208).setData(getLocalFileRes.data);
    }

    const fileInfo = await this.helpers.getFileInfo(tempFile);
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
      const fileProbe = await this.ffmpeg.getMediaContentProbe(tempFile);
      const stream = fileProbe.audioStreams[0];

      size = fileProbe.format.size;
      duration = parseFloat(stream.duration);
    } else if (contentType === MediaType.VIDEO) {
      const fileProbe = await this.ffmpeg.getMediaContentProbe(tempFile);
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
    const dirForFile = path.resolve(locaFiles, year, month, day);
    const pathToFile = path.resolve(dirForFile, fileSha256Hash);
    await fs.mkdirs(dirForFile);
    await fs.move(tempFile, pathToFile);
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
          pathToFile,
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
          pathToFile,
          type: contentType,
        },
      });
    }

    stdRes.setData(localFile);
    return stdRes;
  }
}
