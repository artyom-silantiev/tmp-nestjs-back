import { Env } from '@share/env/env';
import * as fs from 'fs-extra';

export async function useDirs(env: Env) {
  await fs.mkdirs(env.DIR_TEMP_FILES);
}
