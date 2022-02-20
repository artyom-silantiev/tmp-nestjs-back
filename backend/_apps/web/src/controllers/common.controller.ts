import { Controller, Get } from '@nestjs/common';
import { CommonSerivce } from './common.service';

@Controller()
export class CommonController {
  constructor(private common: CommonSerivce) {}
}
