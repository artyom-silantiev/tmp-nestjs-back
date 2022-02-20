import { Module } from '@nestjs/common';

import { DbModule } from '@db/db.module';
import { AuthModule } from '@share/modules/auth/auth.module';
import { AppMailerModule } from '@share/modules/app-mailer/app-mailer.module';
import { JwtModule } from '@share/modules/jwt/jwt.module';
import { IpfsModule } from '@share/modules/ipfs/ipfs.module';
import { ClearDataModule } from '@share/modules/clear-data/clear-data.module';

import { CommonController } from './common.controller';
import { UsersController } from './api/users.controller';

import { IpfsController } from './ipfs.controller';
import { UserCommonController } from './api/user/common.controller';
import { ApiCommonController } from './api/api-common.controller';

import { PaginationService } from '@share/services/pagination.service';
import { FFmpegService } from '@share/services/ffmpeg.service';
import { CommonSerivce } from './common.service';
import { RedisModule } from '@share/modules/redis/redis.module';
import { ClusterAppModule } from '@share/modules/cluster-app/cluster-app.module';

@Module({
  imports: [
    RedisModule,
    DbModule,
    IpfsModule,
    ClusterAppModule,
    AuthModule,
    AppMailerModule,
    JwtModule,
    ClearDataModule,
  ],
  providers: [PaginationService, FFmpegService, CommonSerivce],
  controllers: [
    // /*
    CommonController,

    // HEAD /sha256/:sha256Parma
    // GET /sha256/:sha256Parma
    // HEAD /sha256/:sha256Parma/:args
    // GET /sha256/:sha256Parma/:args
    IpfsController,

    // /api*
    ApiCommonController,

    // /api/users*
    UsersController,

    // /api/user*
    UserCommonController,
  ],
})
export class ControllersModule {}
