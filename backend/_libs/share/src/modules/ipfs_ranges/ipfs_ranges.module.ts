import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { IpfsRangesService } from './ipfs_ranges.service';

@Module({
  imports: [CommonModule],
  providers: [IpfsRangesService],
  exports: [IpfsRangesService],
})
export class IpfsRangesModule {}
