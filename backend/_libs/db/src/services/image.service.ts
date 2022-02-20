import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { Image, IpfsObject, User } from "@prisma/client";

export type ImageRow = Image & {
  IpfsObject?: IpfsObject;
  Users?: User[];
};

@Injectable()
export class ImageService {
  constructor(private prisma: PrismaService) {}

  async create(ipfsObject: IpfsObject) {
    const image = await this.prisma.image.create({
      data: {
        ipfsObjectId: ipfsObject.id,
      },
    });

    return image;
  }
}
