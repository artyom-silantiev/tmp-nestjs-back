import { Module } from '@nestjs/common';
import { BcryptService } from './bcrypt.service';
import { Bs58Service } from './bs58.service';
import { HelpersService } from './helpers.service';

@Module({
  imports: [],
  providers: [BcryptService, Bs58Service, HelpersService],
  exports: [BcryptService, Bs58Service, HelpersService],
})
export class CommonModule {}
