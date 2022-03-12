import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  Image,
  ImageStorage,
  IpfsObject,
  LocalFile,
  User,
} from '@prisma/client';

export type ImageRow = Image & {
  IpfsObject?: IpfsObject;
  Users?: User[];
};

@Injectable()
export class ImageService {
  constructor(private prisma: PrismaService) {}

  async createByIpfsObject(ipfsObject: IpfsObject) {
    const image = await this.prisma.image.create({
      data: {
        storage: ImageStorage.IpfsObject,
        ipfsObjectId: ipfsObject.id,
      },
    });

    return image;
  }

  async createByLocalFile(localFile: LocalFile) {
    const image = await this.prisma.image.create({
      data: {
        storage: ImageStorage.LocalFile,
        localFileId: localFile.id,
      },
    });

    return image;
  }
}
