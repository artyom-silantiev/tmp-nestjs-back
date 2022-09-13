import { Module } from '@nestjs/common';
import { IpfsModule } from '@share/modules/ipfs/ipfs.module';
import { IpfsController } from './ipfs.controller';

@Module({
  imports: [IpfsModule],
  controllers: [
    // HEAD /ipfs/sha256/:sha256Parma
    // GET /ipfs/sha256/:sha256Parma
    // HEAD /ipfs/sha256/:sha256Parma/:args
    // GET /ipfs/sha256/:sha256Parma/:args
    IpfsController,
  ],
})
export class RouteIpfsModule {}
