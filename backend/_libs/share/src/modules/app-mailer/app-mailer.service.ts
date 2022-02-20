import { TaskService } from "@db/services/task.service";
import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { TaskType } from "@prisma/client";
import * as path from "path";
import { EnvService, SendEmailType } from "../env/env.service";

@Injectable()
export class AppMailerService {
  constructor(
    private env: EnvService,
    private task: TaskService,
    private mailer: MailerService
  ) {}

  async sendEmailNow(params: ISendMailOptions) {
    return await this.mailer.sendMail(params);
  }

  async sendEmailTask(params: ISendMailOptions) {
    await this.task.taskCreate(TaskType.SEND_EMAIL, params);
  }

  async sendEmail(params: ISendMailOptions) {
    if (params.template) {
      params.template = path.join(
        process.cwd(),
        "assets",
        "views",
        "email",
        params.template
      );
    }

    if (this.env.MAILER_SEND_EMAIL_TYPE === SendEmailType.sync) {
      return await this.sendEmailNow(params);
    } else if (this.env.MAILER_SEND_EMAIL_TYPE === SendEmailType.queue) {
      await this.sendEmailTask(params);
    }
  }
}
