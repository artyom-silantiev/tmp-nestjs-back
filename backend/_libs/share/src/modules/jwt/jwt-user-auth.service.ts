import { Injectable } from '@nestjs/common';
import { Bs58Service } from '@share/modules/common/bs58.service';
import * as jwt from 'jsonwebtoken';
import { EnvService } from '../env/env.service';
import { JwtType } from '@prisma/client';
import { JwtDbService } from '@db/services/jwt-db.service';

export class JwtUserAuthPayload {
  sub: string;
  uid: string;
}

@Injectable()
export class JwtUserAuthService {
  private SECRET: string;
  private TTL_SEC: number;

  constructor(
    private envService: EnvService,
    private bs58Service: Bs58Service,
    private jwtDb: JwtDbService,
  ) {
    this.SECRET = envService.SECRET_JWT_AUTH;
    this.TTL_SEC = envService.JWT_AUTH_TTL_SEC;
  }

  async create(userId: bigint) {
    const uid = this.bs58Service.uuid();
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
