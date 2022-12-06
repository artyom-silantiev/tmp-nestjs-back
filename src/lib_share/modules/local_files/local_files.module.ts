import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { LocalFilesInputService } from './local_files-input.service';
import { LocalFilesMakeService } from './local_files-make.service';
import { LocalFilesOutputService } from './local_files-output.service';
import { LocalFilesController } from './local_files.controller';

@Module({
  imports: [DbModule],
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
  controllers: [LocalFilesController],
})
export class LocalFilesModule {}
