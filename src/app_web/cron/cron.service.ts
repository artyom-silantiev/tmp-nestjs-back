import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskType } from '@prisma/client';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { Logger } from '@share/logger';
import { useEnv } from '@share/lib/env/env';
import { TaskRepository } from '@db/repositories/task.repository';
import { AppMailerService } from '@share/modules/app-mailer/app-mailer.service';
import { PrismaService } from '@db/prisma.service';
import { QueueJob } from '@share/modules/queue_job/queue_job.decorator';
import { sleep } from '@share/helpers';

@Injectable()
export class CronService {
  private env = useEnv();
  private logger = new Logger('CronService');

  constructor(
    private prisma: PrismaService,
    private mailer: AppMailerService,
    private taskService: TaskRepository,
  ) {}

  // @QueueJob(1000)
  private test() {
    this.logger.debug('test');
  }

  // @Cron(CronExpression.EVERY_5_SECONDS)
  private async test2() {
    const number = Date.now();
    this.logger.log('test2 start', number);
    await new Promise((resolve) => {
      setTimeout(() => {
        this.logger.log('test2 end', number);
        resolve(true);
      }, 10000);
    });
  }

  // @QueueJob(1000)
  private async test3() {
    await sleep(5000);
    this.logger.debug('test 3');
  }

  // @QueueJob(1000)
  private async test4() {
    await sleep(5000);
    throw new Error('error!');
  }

  @QueueJob(1000 * useEnv().MAILER_QUEUE_DELAY_SEC)
  private async mailerSend() {
    const delayMs = 1000 * this.env.MAILER_QUEUE_DELAY_SEC;

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
  }
}
