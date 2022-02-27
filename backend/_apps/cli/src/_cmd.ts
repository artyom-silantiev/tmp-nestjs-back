import * as yargs from 'yargs';
import { EnvService } from '@share/modules/env/env.service';
import { Bs58Service } from '@share/modules/common/bs58.service';
import { EnvCommand } from './env.command';

(async () => {
  const env = new EnvService();
  const bs58 = new Bs58Service();
  const envCommand = new EnvCommand(env, bs58);

  const args = await yargs.parseAsync(process.argv);
  const cmdName = args._[2];

  if (cmdName === 'env:print_default') {
    envCommand.envPrintDefault();
  } else if (cmdName === 'env:setup') {
    envCommand.envSetup();
  }
})();
