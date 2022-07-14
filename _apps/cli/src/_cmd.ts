import * as yargs from 'yargs';
import { EnvCommand } from './env.command';

(async () => {
  const envCommand = new EnvCommand();

  const args = await yargs.parseAsync(process.argv);
  const cmdName = args._[2];

  if (cmdName === 'env:print_default') {
    envCommand.envPrintDefault();
  } else if (cmdName === 'env:setup') {
    envCommand.envSetup();
  }
})();
