import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@db/prisma.service';
import { UserRepository } from '@db/repositories/user.repository';

@Injectable()
export class DbFixCommand {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
  ) {}
}
