import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@share/modules/jwt/jwt.module';
import { DbModule } from '@db/db.module';

@Module({
  imports: [DbModule, PassportModule, JwtModule],
  providers: [AuthService, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
