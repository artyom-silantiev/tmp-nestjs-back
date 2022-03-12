import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { EnvModule } from '../env/env.module';
import { LocalFilesInputService } from './local_files-input.service';
import { FFmpegService } from '@share/services/ffmpeg.service';
import { S3Module } from '../s3/s3.module';
import { CommonModule } from '../common/common.module';
import { LocalFilesMakeService } from './local_files-make.service';

@Module({
  imports: [EnvModule, CommonModule, S3Module, DbModule],
  providers: [FFmpegService, LocalFilesMakeService, LocalFilesInputService],
  exports: [LocalFilesMakeService, LocalFilesInputService],
})
export class LocalFilesModule {}
