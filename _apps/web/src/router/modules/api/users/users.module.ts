import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { AppMailerModule } from '@share/modules/app-mailer/app-mailer.module';
import { AuthModule } from '@share/modules/auth/auth.module';
import { JwtModule } from '@share/modules/jwt/jwt.module';
import { UsersController } from './users.controller';

@Module({
  imports: [DbModule, AuthModule, AppMailerModule, JwtModule],
  controllers: [
    // /api/users*
    UsersController,
  ],
})
export class RouteUsersModule {}
