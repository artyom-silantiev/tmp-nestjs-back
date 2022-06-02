import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { JwtUserActivationService } from './jwt-user-activation.service';
import { JwtUserAuthService } from './jwt-user-auth.service';
import { JwtUserRecoveryService } from './jwt-user-recovery.service';

@Module({
  imports: [DbModule],
  providers: [
    JwtUserAuthService,
    JwtUserActivationService,
    JwtUserRecoveryService,
  ],
  exports: [
    JwtUserAuthService,
    JwtUserActivationService,
    JwtUserRecoveryService,
  ],
})
export class JwtModule {}
