import { Module } from '@nestjs/common';
import { BaseService } from './_base_.service';

@Module({
  imports: [],
  providers: [BaseService],
  exports: [BaseService],
})
export class BaseModule {}
