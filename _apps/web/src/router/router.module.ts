import { Module } from '@nestjs/common';
import { RouteUsersModule } from './modules/api/users/users.module';
import { RouteUserModule } from './modules/api/user/user.module';
import { RouteIpfsModule } from './modules/ipfs/ipfs.module';
import { RouteLocalFilesModule } from './modules/local_files/local_files.module';
import { ApiCommonController } from './modules/api/api-common.controller';

@Module({
  imports: [
    // HEAD /ipfs/sha256/:sha256Parma
    // GET /ipfs/sha256/:sha256Parma
    // HEAD /ipfs/sha256/:sha256Parma/:args
    // GET /ipfs/sha256/:sha256Parma/:args
    RouteIpfsModule,

    // HEAD /local_files/sha256/:sha256Parma
    // GET /local_files/sha256/:sha256Parma
    // HEAD /local_files/sha256/:sha256Parma/:args
    // GET /local_files/sha256/:sha256Parma/:args
    RouteLocalFilesModule,

    // /api/users*
    RouteUsersModule,

    // /api/user*
    RouteUserModule,
  ],
  controllers: [
    // /api/*
    ApiCommonController,
  ],
})
export class RouterModule {}
