import { Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';
import { AppMailerModule } from '@share/modules/app-mailer/app-mailer.module';
import { DbModule } from '@db/db.module';

import { CronService } from './cron.service';
import { QueueJobModule } from '@share/modules/queue_job/queue_job.module';

@Module({
  imports: [
    DbModule,
    AppMailerModule,
    ScheduleModule.forRoot(),
    QueueJobModule.forRoot(),
  ],
  providers: [CronService],
})
export class CronModule {}
