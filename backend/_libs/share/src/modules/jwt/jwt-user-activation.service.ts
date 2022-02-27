import { Bs58Service } from '@share/modules/common/bs58.service';
import { JwtDbService } from '@db/services/jwt-db.service';
import { Injectable } from '@nestjs/common';
import { Jwt, JwtType } from '@prisma/client';
import * as jwt from 'jsonwebtoken';
import { EnvService } from '../env/env.service';

export enum UserActivationType {
  signup = 'signup',
  emailChange = 'emailChange',
}

export type UserActivationMeta =
  | {
      type: UserActivationType.signup;
    }
  | {
      type: UserActivationType.emailChange;
      email: string;
    };
export class JwtUserActivationPayload {
  userId: string;
  uid: string;
}
@Injectable()
export class JwtUserActivationService {
  private SECRET: string;
  private TTL_SEC: number;

  constructor(
    private envService: EnvService,
    private bs58Service: Bs58Service,
    private jwtDb: JwtDbService,
  ) {
    this.SECRET = envService.SECRET_JWT_ACTIVATION;
    this.TTL_SEC = envService.JWT_ACTIVATION_TTL_SEC;
  }

  async create(userId: bigint, metaData: UserActivationMeta) {
    const uid = this.bs58Service.uuid();
    const payload = {
      userId: userId.toString(),
      uid,
    } as JwtUserActivationPayload;
    const ttlSec = this.TTL_SEC;
    const token = jwt.sign(payload, this.SECRET, {
      expiresIn: this.TTL_SEC + 's',
    });

    const expirationTsMs = Math.floor(Date.now() + ttlSec * 1000);
    const expirationAt = new Date(expirationTsMs);
    const jwtRow = await this.jwtDb.create(
      JwtType.USER_ACTIVATION,
      userId,
      uid,
      expirationAt,
      metaData,
    );

    return { token, uid, jwtRow };
  }

  verify(token: string) {
    return jwt.verify(token, this.SECRET) as JwtUserActivationPayload;
  }

  async check(token: string) {
    try {
      const payload = this.verify(token);
      const jwtRow = (await this.jwtDb.getLiveJwt(
        JwtType.USER_ACTIVATION,
        payload.uid,
      )) as Jwt & { meta: UserActivationMeta };
      if (!jwtRow) {
        return null;
      }
      return { payload, jwtRow };
    } catch (error) {}

    return null;
  }
}
