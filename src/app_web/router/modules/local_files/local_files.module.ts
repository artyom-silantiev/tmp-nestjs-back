import { Module } from '@nestjs/common';
import { LocalFilesModule } from '@share/modules/local_files/local_files.module';
import { LocalFilesController } from './local_files.controller';

@Module({
  imports: [LocalFilesModule],
  controllers: [LocalFilesController],
})
export class LocalFilesRouteModule {}
