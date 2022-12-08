import { Module } from '@nestjs/common';

import { ScheduleModule } from '@nestjs/schedule';
import { AppMailerModule } from '@share/modules/app-mailer/app-mailer.module';
import { DbModule } from '@db/db.module';

import { CronService } from './cron.service';
import { QueueTimerModule } from '@share/modules/queue_timer/queue_timer.module';

@Module({
  imports: [
    DbModule,
    AppMailerModule,
    ScheduleModule.forRoot(),
    QueueTimerModule.forRoot(),
  ],
  providers: [CronService],
})
export class CronModule {}
