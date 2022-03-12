import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { EnvModule } from '../env/env.module';
import { IpfsCacheService } from './ipfs-cache.service';
import { IpfsInputService } from './ipfs-input.service';
import { IpfsOutputService } from './ipfs-output.service';
import { IpfsStorageService } from './ipfs-storage.service';
import { FFmpegService } from '@share/services/ffmpeg.service';
import { S3Module } from '../s3/s3.module';
import { CommonModule } from '../common/common.module';
import { IpfsMakeService } from './ipfs-make.service';

@Module({
  imports: [EnvModule, CommonModule, S3Module, DbModule],
  providers: [
    FFmpegService,

    IpfsMakeService,
    IpfsInputService,
    IpfsCacheService,
    IpfsStorageService,
    IpfsOutputService,
  ],
  exports: [
    IpfsMakeService,
    IpfsInputService,
    IpfsCacheService,
    IpfsStorageService,
    IpfsOutputService,
  ],
})
export class IpfsModule {}
