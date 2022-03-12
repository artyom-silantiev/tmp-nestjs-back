import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LocalFile, Image } from '@prisma/client';
import { StandardResult } from '@share/standard-result.class';

export type IpfsObjectRow = LocalFile & {
  Images?: Image[];
  ThumbsAsOrg?: LocalFile[];
  ThumbsAsThumb?: LocalFile[];
};

@Injectable()
export class LocalFileService {
  constructor(private prisma: PrismaService) {}

  async getLocalFileById(id: bigint) {
    const localFile = await this.prisma.localFile.findFirst({
      where: {
        id,
      },
    });
    return localFile || null;
  }

  async getLocalFileBySha256Hash(sha256: string) {
    const res = new StandardResult<LocalFile>();

    const localFile = await this.prisma.localFile.findFirst({
      where: {
        sha256,
      },
    });

    if (!localFile) {
      return res.setCode(404);
    }

    return res.setData(localFile);
  }

  async getThumbs(localFile: LocalFile) {
    const localFileThumbs = await this.prisma.localFileThumb.findMany({
      where: {
        orgLocalFileId: localFile.id,
      },
    });
    return localFileThumbs;
  }
}
