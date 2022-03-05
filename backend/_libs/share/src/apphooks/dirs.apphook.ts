import { EnvService } from '@share/modules/env/env.service';
import * as fs from 'fs-extra';

export async function useDirs(env: EnvService) {
  await fs.mkdirs(env.DIR_TEMP_FILES);
}
