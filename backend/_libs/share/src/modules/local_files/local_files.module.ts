import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { LocalFilesInputService } from './local_files-input.service';
import { CommonModule } from '../common/common.module';
import { LocalFilesMakeService } from './local_files-make.service';
import { LocalFilesOutputService } from './local_files-output.service';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [CommonModule, RedisModule, DbModule],
  providers: [
    LocalFilesMakeService,
    LocalFilesInputService,
    LocalFilesOutputService,
  ],
  exports: [
    LocalFilesMakeService,
    LocalFilesInputService,
    LocalFilesOutputService,
  ],
})
export class LocalFilesModule {}
