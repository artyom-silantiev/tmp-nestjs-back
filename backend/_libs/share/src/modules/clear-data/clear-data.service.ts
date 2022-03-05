import { PrismaService } from '@db/prisma.service';
import { Injectable } from '@nestjs/common';
import { MediaType } from '@prisma/client';
import { EnvService } from '../env/env.service';
import { IpfsCacheService } from '../ipfs/ipfs-cache.service';
import { IpfsStorageService } from '../ipfs/ipfs-storage.service';
import { UserService } from '@db/services/user.service';

@Injectable()
export class ClearDataService {
  constructor(
    private env: EnvService,
    private prisma: PrismaService,
    private ipfsCache: IpfsCacheService,
    private ipfsStorage: IpfsStorageService,
  ) {}

  async safeDeleteUserById(userId: bigint) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
      include: {
        Image: true,
      },
    });

    if (!user) {
      throw new Error('user not found');
    }

    if (user.Image) {
      await this.deleteImageById(user.Image.id);
    }

    await this.prisma.jwt.deleteMany({
      where: {
        userId: user.id,
      },
    });

    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        email: `:deleted:${userId.toString()}:`,
        deletedAt: new Date(),
      },
    });
  }

  async deleteImageById(imageId: bigint) {
    const image = await this.prisma.image.findUnique({
      where: {
        id: imageId,
      },
      include: {
        IpfsObject: true,
      },
    });

    await this.prisma.image.delete({
      where: {
        id: image.id,
      },
    });

    await this.tryDeleteIpfsObjectById(image.IpfsObject.id);
  }

  async tryDeleteIpfsObjectById(
    ipfsObjectId: bigint,
    params?: {
      ignoreImageId?: bigint;
      ignoreThumbOrgId?: bigint;
    },
  ) {
    const ipfsObject = await this.prisma.ipfsObject.findFirst({
      where: {
        id: ipfsObjectId,
      },
      include: {
        Images: true,
        ThumbsOrg: {
          where: {
            orgIpfsObjectId: {
              not: ipfsObjectId,
            },
          },
        },
      },
    });

    let ipfsObjectImages = ipfsObject.Images ? ipfsObject.Images : [];
    if (params && params.ignoreImageId) {
      ipfsObjectImages = ipfsObjectImages.filter(
        (v) => v.id !== params.ignoreImageId,
      );
    }

    let ipfsObjectThumbsOrg = ipfsObject.ThumbsOrg ? ipfsObject.ThumbsOrg : [];
    if (params && params.ignoreThumbOrgId) {
      ipfsObjectThumbsOrg = ipfsObjectThumbsOrg.filter(
        (v) => v.id !== params.ignoreThumbOrgId,
      );
    }

    if (ipfsObjectImages.length > 0 || ipfsObjectThumbsOrg.length > 0) {
      return false;
    }

    // delete thumbs ...
    if (ipfsObject.type === MediaType.IMAGE && !ipfsObject.isThumb) {
      const ipfsObjectThumbs = await this.prisma.ipfsObjectThumb.findMany({
        where: {
          orgIpfsObjectId: ipfsObject.id,
        },
      });

      for (const ipfsObjectThumb of ipfsObjectThumbs) {
        await this.tryDeleteIpfsObjectById(ipfsObjectThumb.thumbIpfsObjectId, {
          ignoreThumbOrgId: ipfsObject.id,
        });
      }

      await this.prisma.ipfsObjectThumb.deleteMany({
        where: {
          orgIpfsObjectId: ipfsObject.id,
        },
      });
    }

    if (ipfsObject.isThumb) {
      await this.prisma.ipfsObjectThumb.deleteMany({
        where: {
          thumbIpfsObjectId: ipfsObject.id,
        },
      });
    }

    await this.ipfsStorage.s3Client.deleteObject(ipfsObject.sha256);
    await this.ipfsCache.deleteCacheItem(ipfsObject.sha256);

    await this.prisma.ipfsObject.delete({
      where: {
        id: ipfsObject.id,
      },
    });
  }
}
