import { Injectable } from '@nestjs/common';
import { useEnv } from '@share/env/env';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService {
  private env = useEnv();

  constructor() {}

  async generatePasswordHash(passwordText: string, passwordSalt?: string) {
    passwordSalt = passwordSalt || this.env.SECRET_PASSWORD_SALT;
    passwordText += passwordSalt;
    return await bcrypt.hash(passwordText, 10);
  }

  async compare(
    passwordText: string,
    passwordHash: string,
    passwordSalt?: string,
  ) {
    passwordSalt = passwordSalt || this.env.SECRET_PASSWORD_SALT;
    passwordText += passwordSalt;
    return bcrypt.compare(passwordText, passwordHash);
  }
}
