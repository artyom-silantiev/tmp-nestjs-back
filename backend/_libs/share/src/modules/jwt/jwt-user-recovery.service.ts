import { Bs58Service } from "@share/modules/common/bs58.service";
import { JwtDbService } from "@db/services/jwt-db.service";
import { Injectable } from "@nestjs/common";
import { JwtType } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import { EnvService } from "../env/env.service";

export class JwtUserRecoveryPayload {
  userId: string;
  uid: string;
}

@Injectable()
export class JwtUserRecoveryService {
  private SECRET: string;
  private TTL_SEC: number;

  constructor(
    private envService: EnvService,
    private bs58Service: Bs58Service,
    private jwtDb: JwtDbService
  ) {
    this.SECRET = envService.JWT_RECOVERY_SECRET;
    this.TTL_SEC = envService.JWT_RECOVERY_TTL_SEC;
  }

  async create(userId: bigint) {
    const uid = this.bs58Service.uuid();
    const payload = {
      userId: userId.toString(),
      uid,
    } as JwtUserRecoveryPayload;
    const ttlSec = this.TTL_SEC;
    const token = jwt.sign(payload, this.SECRET, {
      expiresIn: ttlSec + "s",
    });

    const expirationTsMs = Math.floor(Date.now() + ttlSec * 1000);
    const expirationAt = new Date(expirationTsMs);
    const jwtRow = await this.jwtDb.create(
      JwtType.USER_RECOVERY,
      userId,
      uid,
      expirationAt
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
        payload.uid
      );
      if (!jwtRow) {
        return null;
      }
      return { payload, jwtRow };
    } catch (error) {}

    return null;
  }
}
