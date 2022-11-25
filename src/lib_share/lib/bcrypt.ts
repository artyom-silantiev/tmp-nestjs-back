import { useEnv } from '@share/lib/env/env';
import * as bcrypt from 'bcrypt';

class Bcrypt {
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

const _bcrypt = new Bcrypt();
export function useBcrypt() {
  return _bcrypt;
}
