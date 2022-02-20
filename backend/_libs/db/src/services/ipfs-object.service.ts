import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { IpfsObject, Image } from "@prisma/client";
import { Bs58Service } from "@share/modules/common/bs58.service";
import { StandardResult } from "@share/standard-result.class";

export type IpfsObjectRow = IpfsObject & {
  Images?: Image[];
  ThumbsOrg?: IpfsObject[];
  ThumbsThumb?: IpfsObject[];
};

@Injectable()
export class IpfsObjectService {
  constructor(
    private prisma: PrismaService,
    private bs58Service: Bs58Service
  ) {}

  async getIpfsObjectById(id: bigint) {
    const ipfsObject = await this.prisma.ipfsObject.findFirst({
      where: {
        id,
      },
    });
    return ipfsObject || null;
  }

  async getIpfsObjectBySha256Hash(sha256: string) {
    const res = new StandardResult<IpfsObject>();

    const ipfsObject = await this.prisma.ipfsObject.findFirst({
      where: {
        sha256,
      },
    });

    if (!ipfsObject) {
      return res.setCode(404);
    }

    return res.setData(ipfsObject);
  }

  async getThumbs(ipfsObject: IpfsObject) {
    const ipfsObjectThumbs = await this.prisma.ipfsObjectThumb.findMany({
      where: {
        orgIpfsObjectId: ipfsObject.id,
      },
    });
    return ipfsObjectThumbs;
  }
}
