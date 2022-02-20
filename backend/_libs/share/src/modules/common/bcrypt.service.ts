import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { EnvService } from '../env/env.service';

@Injectable()
export class BcryptService {
  constructor(private envService: EnvService) {}

  async generatePasswordHash(passwordText: string, passwordSalt?: string) {
    passwordSalt = passwordSalt || this.envService.PASSWORD_SALT;
    passwordText += passwordSalt;
    return await bcrypt.hash(passwordText, 10);
  }

  async compare(
    passwordText: string,
    passwordHash: string,
    passwordSalt?: string,
  ) {
    passwordSalt = passwordSalt || this.envService.PASSWORD_SALT;
    passwordText += passwordSalt;
    return bcrypt.compare(passwordText, passwordHash);
  }
}
