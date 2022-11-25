import { Env } from '@share/lib/env/env';
import * as fs from 'fs-extra';

export async function appUseDirs(env: Env) {
  await fs.mkdirs(env.DIR_TEMP_FILES);
}
