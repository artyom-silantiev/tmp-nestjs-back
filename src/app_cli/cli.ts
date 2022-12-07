import { NestFactory } from '@nestjs/core';
import { CommandModule, CommandService } from 'nestjs-command';
import { CliModule } from './cli.module';

(async () => {
  const app = await NestFactory.createApplicationContext(CliModule);
  app.select(CommandModule).get(CommandService).exec();
})();
