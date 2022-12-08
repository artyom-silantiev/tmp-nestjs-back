import { Injectable } from '@nestjs/common';
import { LocalFilesRequest } from './local_files_request';
import { StandardResult } from '@share/standard-result.class';
import { LocalFilesMakeService } from './local_files-make.service';
import { LocalFile, MediaType } from '@prisma/client';
import { LocalFileRepository } from '@db/repositories/local-file.repository';
import { PrismaService } from '@db/prisma.service';
import * as _ from 'lodash';
import * as path from 'path';
import { useEnv } from '@share/lib/env/env';
import { useCacheLocalFile } from '@share/lib/cache/local-file';

export type LocalFileMeta = {
  absPathToFile: string;
  sha256: string;
  contentType: MediaType;
  mime: string;
  size: number;
  width: number | null;
  height: number | null;
  durationSec: number | null;
  isThumb: boolean;
  createdAt: Date;
};

@Injectable()
export class LocalFilesOutputService {
  private env = useEnv();
  private cacheLocalFile = useCacheLocalFile();

  constructor(
    private prisma: PrismaService,
    private localFileRepository: LocalFileRepository,
    private localFilesMake: LocalFilesMakeService,
  ) {}

  async getLocalFilePathByLocalFilesRequest(
    localFilesRequest: LocalFilesRequest,
  ) {
    const stdRes = new StandardResult<LocalFileMeta>();
    const sha256 = localFilesRequest.sha256;

    const cacheLocalFileMetaRaw = await this.cacheLocalFile.get(
      localFilesRequest,
    );
    if (cacheLocalFileMetaRaw) {
      const cacheLocalFileMeta = JSON.parse(
        cacheLocalFileMetaRaw,
      ) as LocalFileMeta;
      return stdRes.setData(cacheLocalFileMeta);
    }

    const localFileRes =
      await this.localFileRepository.getLocalFileBySha256Hash(sha256);
    if (localFileRes.isBad) {
      return stdRes.mergeBad(localFileRes);
    }
    const tmpLocalFile = localFileRes.data;

    let localFile: LocalFile;
    if (localFilesRequest.thumb && !tmpLocalFile.isThumb) {
      if (localFileRes.data.type !== MediaType.IMAGE) {
        return stdRes
          .setCode(406)
          .setErrData('thumbs size param for not thumbs allow object');
      }

      const thumb = localFilesRequest.thumb;
      if (thumb.type === 'width') {
        thumb.name = LocalFilesRequest.parseThumbSize(
          parseInt(thumb.name),
          tmpLocalFile.width,
          this.env.IPFS_CACHE_MIN_THUMB_LOG_SIZE,
        );
      } else if (thumb.type === 'name') {
        if (thumb.name === 'fullhd') {
          if (tmpLocalFile.width > 1920 || tmpLocalFile.height > 1920) {
            // noting
          } else {
            localFile = tmpLocalFile;
          }
        }
      }

      if (!localFile) {
        const localFileThumb = await this.prisma.localFileThumb.findFirst({
          where: {
            orgLocalFileId: tmpLocalFile.id,
            thumbName: thumb.name,
          },
          include: {
            ThumbLocalFile: true,
          },
        });

        if (localFileThumb) {
          localFile = localFileThumb.ThumbLocalFile;
        }
      }

      if (!localFile) {
        const createThumbRes =
          await this.localFilesMake.createNewThumbForLocalFile(
            tmpLocalFile,
            thumb,
          );
        if (createThumbRes.isBad) {
          return stdRes.mergeBad(createThumbRes);
        }
        localFile = createThumbRes.data;
      }
    } else {
      localFile = tmpLocalFile;
    }

    const absPathToFile = path.resolve(
      this.env.DIR_LOCAL_FILES,
      localFile.pathToFile,
    );
    const localFileMeta = {
      absPathToFile,
      sha256: localFile.sha256,
      contentType: localFile.type,
      mime: localFile.mime,
      size: localFile.size,
      width: localFile.width || null,
      height: localFile.height || null,
      durationSec: localFile.durationSec || null,
      isThumb: localFile.isThumb,
      createdAt: localFile.createdAt,
    } as LocalFileMeta;

    await this.cacheLocalFile.set(localFilesRequest, localFileMeta);

    return stdRes.setData(localFileMeta);
  }
}
