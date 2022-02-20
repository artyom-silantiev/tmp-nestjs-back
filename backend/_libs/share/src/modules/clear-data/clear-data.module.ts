import { DbModule } from '@db/db.module';
import { Module } from '@nestjs/common';
import { IpfsModule } from '../ipfs/ipfs.module';
import { ClearDataService } from './clear-data.service';
import { ClearMediaFileService } from './clear-media-file.service';
import { S3Module } from '../s3/s3.module';

@Module({
  imports: [DbModule, S3Module, IpfsModule],
  providers: [ClearDataService, ClearMediaFileService],
  exports: [ClearDataService],
})
export class ClearDataModule {}
