import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@db/prisma.service';
import { UserService } from '@db/services/user.service';

@Injectable()
export class DbFixCommand {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}
}
