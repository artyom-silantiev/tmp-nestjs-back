import { Module } from '@nestjs/common';
import { LocalFilesModule } from '@share/modules/local_files/local_files.module';
import { LocalFilesController } from './local_files.controller';

@Module({
  imports: [LocalFilesModule],
  controllers: [
    // HEAD /ipfs/sha256/:sha256Parma
    // GET /ipfs/sha256/:sha256Parma
    // HEAD /ipfs/sha256/:sha256Parma/:args
    // GET /ipfs/sha256/:sha256Parma/:args
    LocalFilesController,
  ],
})
export class RouteLocalFilesModule {}
