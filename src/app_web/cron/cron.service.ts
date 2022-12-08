import { Injectable, OnModuleInit } from '@nestjs/common';
import { CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { TaskType } from '@prisma/client';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { CronJob } from 'cron';
import { Logger } from '@share/logger';
import { startQueue } from '@share/helpers';
import { SendEmailType, useEnv } from '@share/lib/env/env';
import { TaskService } from '@db/services/task.service';
import { AppMailerService } from '@share/modules/app-mailer/app-mailer.service';
import { PrismaService } from '@db/prisma.service';

@Injectable()
export class CronService implements OnModuleInit {
  private env = useEnv();
  private logger = new Logger('CronService');

  constructor(
    private prisma: PrismaService,
    private schedulerRegistry: SchedulerRegistry,
    private mailer: AppMailerService,
    private taskService: TaskService,
  ) {}

  async onModuleInit() {
    this.cronInit();
  }

  private cronInit() {
    // this.startCronTest();
    // this.startQueueTest();

    // daemon master

    if (this.env.MAILER_SEND_EMAIL_TYPE === SendEmailType.queue) {
      this.startQueueMailerSend();
    }
  }

  //
  // crons ...
  //

  private startCronTest() {
    const job = new CronJob(CronExpression.EVERY_5_SECONDS, async () => {
      const number = Date.now();
      this.logger.log('start', number);
      await new Promise((resolve) => {
        setTimeout(() => {
          this.logger.log('end', number);
          resolve(true);
        }, 10000);
      });
    });

    this.schedulerRegistry.addCronJob('test', job);
    job.start();
  }

  private startQueueTest() {
    const delayMs = 1000;

    startQueue({
      name: 'test',
      handle: async () => {
        this.logger.debug('test');
      },
      delayMs,
      logger: this.logger,
    });
  }

  private startQueueMailerSend() {
    const delayMs = 1000 * this.env.MAILER_QUEUE_DELAY_SEC;

    startQueue({
      name: 'mailer send',
      handle: async () => {
        const taskTypes = [TaskType.SEND_EMAIL];
        const attemptes = this.env.MAILER_QUEUE_ATTEMPTS;
        const packSize = this.env.MAILER_QUEUE_PACK_SIZE;
        await this.taskService.handleWrapPack<ISendMailOptions>(
          taskTypes,
          attemptes,
          async (ctx) => {
            await this.mailer.sendEmailNow(ctx.task.data);
          },
          packSize,
        );
      },
      delayMs,
      logger: this.logger,
    });
  }
}
