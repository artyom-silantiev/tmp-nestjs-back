import { TaskRepository } from '@db/repositories/task.repository';
import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { PugAdapter } from '@nestjs-modules/mailer/dist/adapters/pug.adapter';
import { AppMailerService } from './app-mailer.service';
import * as path from 'path';
import { SendEmailService } from './send-email.service';
import { DbModule } from '@db/db.module';
import { useEnv } from '@share/lib/env/env';
import { I18NextModule } from '../i18next';

@Module({
  imports: [
    DbModule,
    I18NextModule,
    MailerModule.forRootAsync({
      useFactory: () => {
        const env = useEnv();

        const smtpHost = env.MAILER_SMTP_HOST;
        const smtpPort = env.MAILER_SMTP_PORT;
        const mailerEncryption = env.MAILER_SMTP_ENCRYPTION;
        const sender = env.MAILER_DEFAULT_SENDER;
        const smtpUser = env.MAILER_SMTP_AUTH_USER;
        const smtpPass = env.MAILER_SMTP_AUTH_PASS;
        const templatesPath = path.join(process.cwd(), 'assets', 'views');

        return {
          transport: {
            host: smtpHost,
            port: smtpPort,
            encryption: mailerEncryption,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          },
          defaults: {
            sender: sender,
          },
          template: {
            dir: templatesPath,
            adapter: new PugAdapter(),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [TaskRepository, AppMailerService, SendEmailService],
  exports: [AppMailerService, SendEmailService],
})
export class AppMailerModule {}
