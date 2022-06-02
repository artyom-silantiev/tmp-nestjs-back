import { JwtDbService } from '@db/services/jwt-db.service';
import { Injectable } from '@nestjs/common';
import { JwtType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { useEnv } from '@share/env/env';
import { useBs58 } from '@share/bs58';

export class JwtUserRecoveryPayload {
  userId: string;
  uid: string;
}

@Injectable()
export class JwtUserRecoveryService {
  private env = useEnv();
  private bs58 = useBs58();

  private SECRET: string;
  private TTL_SEC: number;

  constructor(private jwtDb: JwtDbService) {
    this.SECRET = this.env.SECRET_JWT_RECOVERY;
    this.TTL_SEC = this.env.JWT_RECOVERY_TTL_SEC;
  }

  async create(userId: bigint) {
    const uid = this.bs58.uuid();
    const payload = {
      userId: userId.toString(),
      uid,
    } as JwtUserRecoveryPayload;
    const ttlSec = this.TTL_SEC;
    const token = jwt.sign(payload, this.SECRET, {
      expiresIn: ttlSec + 's',
    });

    const expirationTsMs = Math.floor(Date.now() + ttlSec * 1000);
    const expirationAt = new Date(expirationTsMs);
    const jwtRow = await this.jwtDb.create(
      JwtType.USER_RECOVERY,
      userId,
      uid,
      expirationAt,
    );

    return { token, uid, jwtRow };
  }

  verify(token: string) {
    return jwt.verify(token, this.SECRET) as JwtUserRecoveryPayload;
  }

  async check(token: string) {
    try {
      const payload = this.verify(token);
      const jwtRow = await this.jwtDb.getLiveJwt(
        JwtType.USER_RECOVERY,
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
