import { Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';
import { AppMailerModule } from '@share/modules/app-mailer/app-mailer.module';
import { DbModule } from '@db/db.module';

import { CronService } from './cron.service';

@Module({
  imports: [DbModule, AppMailerModule, ScheduleModule.forRoot()],
  providers: [CronService],
})
export class CronModule {}
