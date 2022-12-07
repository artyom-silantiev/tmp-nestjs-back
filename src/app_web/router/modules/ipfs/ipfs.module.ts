import { Module } from '@nestjs/common';
import { IpfsModule } from '@share/modules/ipfs/ipfs.module';
import { IpfsController } from './ipfs.controller';

@Module({
  imports: [IpfsModule],
  controllers: [IpfsController],
})
export class IpfsRouteModule {}
