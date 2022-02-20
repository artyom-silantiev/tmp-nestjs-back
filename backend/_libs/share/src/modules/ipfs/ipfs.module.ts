import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { EnvModule } from '../env/env.module';
import { IpfsCacheService } from './ipfs-cache.service';
import { IpfsIndexService } from './ipfs-index.service';
import { IpfsOmsService } from './ipfs-oms.service';
import { IpfsStorageService } from './ipfs-storage.service';
import { FFmpegService } from '@share/services/ffmpeg.service';
import { S3Module } from '../s3/s3.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [EnvModule, CommonModule, S3Module, DbModule],
  providers: [
    FFmpegService,

    IpfsIndexService,
    IpfsCacheService,
    IpfsStorageService,
    IpfsOmsService,
  ],
  exports: [
    IpfsIndexService,
    IpfsCacheService,
    IpfsStorageService,
    IpfsOmsService,
  ],
})
export class IpfsModule {}
