import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Jwt, JwtType } from '@prisma/client';

export type JwtRow = Jwt & {
  user?: User;
};

@Injectable()
export class JwtRepository {
  constructor(private prisma: PrismaService) {}

  get R() {
    return this.prisma.jwt;
  }

  async create(
    type: JwtType,
    userId: bigint,
    uid: string,
    expirationAt: Date,
    metaData?: any,
  ) {
    const jwtItem = await this.prisma.jwt.create({
      data: {
        type,
        uid,
        expirationAt,
        userId,
        meta: metaData || undefined,
      },
    });

    return jwtItem;
  }

  async getLiveJwt(type: JwtType, uid: string) {
    const jwtItem = await this.prisma.jwt.findFirst({
      where: {
        type,
        uid,
        expirationAt: {
          gt: new Date(),
        },
      },
    });

    return jwtItem;
  }
}
