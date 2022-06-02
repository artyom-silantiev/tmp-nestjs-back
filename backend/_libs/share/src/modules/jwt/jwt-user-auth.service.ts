import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtType } from '@prisma/client';
import { JwtDbService } from '@db/services/jwt-db.service';
import { Bs58 } from '@share/bs58';
import { useEnv } from '@share/env/env';

export class JwtUserAuthPayload {
  sub: string;
  uid: string;
}

@Injectable()
export class JwtUserAuthService {
  private env = useEnv();

  private SECRET: string;
  private TTL_SEC: number;

  constructor(private jwtDb: JwtDbService) {
    this.SECRET = this.env.SECRET_JWT_AUTH;
    this.TTL_SEC = this.env.JWT_AUTH_TTL_SEC;
  }

  async create(userId: bigint) {
    const uid = Bs58.uuid();
    const payload = {
      sub: userId.toString(),
      uid: uid,
    } as JwtUserAuthPayload;
    const ttlSec = this.TTL_SEC;
    const token = jwt.sign(payload, this.SECRET, {
      expiresIn: ttlSec + 's',
    });

    const expirationTsMs = Math.floor(Date.now() + ttlSec * 1000);
    const expirationAt = new Date(expirationTsMs);
    const jwtRow = await this.jwtDb.create(
      JwtType.USER_AUTH,
      userId,
      uid,
      expirationAt,
    );

    return { uid, token, jwtRow };
  }

  verify(token: string) {
    return jwt.verify(token, this.SECRET) as JwtUserAuthPayload;
  }

  async check(token: string) {
    try {
      const payload = this.verify(token);
      const jwtRow = await this.jwtDb.getLiveJwt(
        JwtType.USER_AUTH,
        payload.uid,
      );
      if (!jwtRow) {
        return null;
      }
      return { payload, jwtRow };
    } catch (error) {}

    return null;
  }
}
