import { Injectable } from "@nestjs/common";
import { EnvService } from "../env/env.service";
import { AppMailerService } from "./app-mailer.service";
import { I18nRequestScopeService } from "nestjs-i18n";

@Injectable()
export class SendEmailService {
  constructor(
    private readonly mailer: AppMailerService,
    private readonly env: EnvService,
    private readonly i18n: I18nRequestScopeService
  ) {}
}
