import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { JwtType } from '@prisma/client';
import { JwtRepository } from '@db/repositories/jwt.repository';
import { useEnv } from '@share/lib/env/env';
import { useBs58 } from '@share/lib/bs58';

export class JwtUserAuthPayload {
  sub: string;
  uid: string;
}

@Injectable()
export class JwtUserAuthService {
  private env = useEnv();
  private bs58 = useBs58();

  private SECRET: string;
  private TTL_SEC: number;

  constructor(private jwtRepository: JwtRepository) {
    this.SECRET = this.env.SECRET_JWT_AUTH;
    this.TTL_SEC = this.env.JWT_AUTH_TTL_SEC;
  }

  async create(userId: bigint) {
    const uid = this.bs58.uid();
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
    const jwtRow = await this.jwtRepository.create(
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
      const jwtRow = await this.jwtRepository.getLiveJwt(
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
