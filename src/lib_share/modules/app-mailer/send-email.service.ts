import { Injectable } from '@nestjs/common';
import { AppMailerService } from './app-mailer.service';
import { I18nRequestScopeService } from 'nestjs-i18n';
import { useEnv } from '@share/lib/env/env';

@Injectable()
export class SendEmailService {
  private env = useEnv();

  constructor(
    private readonly mailer: AppMailerService,
    private readonly i18n: I18nRequestScopeService,
  ) {}
}
