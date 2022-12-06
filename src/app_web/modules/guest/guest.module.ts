import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { AppMailerModule } from '@share/modules/app-mailer/app-mailer.module';
import { AuthModule } from '@share/modules/auth/auth.module';
import { JwtModule } from '@share/modules/jwt/jwt.module';
import { GuestController } from './guest.controller';

@Module({
  imports: [DbModule, AuthModule, AppMailerModule, JwtModule],
  controllers: [GuestController],
})
export class GuestModule {}
