import { DbModule } from "@db/db.module";
import { Module } from "@nestjs/common";
import { JwtUserActivationService } from "./jwt-user-activation.service";
import { JwtUserAuthService } from "./jwt-user-auth.service";
import { JwtUserRecoveryService } from "./jwt-user-recovery.service";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [CommonModule, DbModule],
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
