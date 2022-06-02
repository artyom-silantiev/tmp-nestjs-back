import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@db/prisma.service';
import { UserService, UserViewType } from '@db/services/user.service';

interface Seed {
  name: string;
  handle: () => Promise<void>;
}

@Injectable()
export class SeederCommand {
  constructor(
    private prisma: PrismaService,
    private userService: UserService,
  ) {}

  @Command({
    command: 'seeder',
  })
  async seeder() {
    console.log('Запуск !!!');
    const seeds = [
      {
        name: '0001_create_admin',
        handle: () => {
          return this.seedCreateAdmin();
        },
      },
    ] as Seed[];

    const usedSeeds = await this.prisma.seed.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    const usedSeedsMap = {} as { [seedName: string]: boolean };
    for (const usedSeedName of usedSeeds) {
      console.log(`${usedSeedName.seed} - seed is used`);
      usedSeedsMap[usedSeedName.seed] = true;
    }

    for (const seed of seeds) {
      if (!usedSeedsMap[seed.name]) {
        const seedName = seed.name;
        console.log(`${seedName} - new seed!`);
        await seed.handle();
        await this.prisma.seed.create({
          data: {
            seed: seedName,
          },
        });
      }
    }

    process.exit(0);
  }

  async seedCreateAdmin() {
    const data = await this.userService.createUser({
      password: 'password',
      email: 'admin@example.com',
      emailActivatedAt: new Date(),
      role: UserRole.ADMIN,
      firstName: 'ADMIN',
      lastName: 'POWER',
      phone: '+79001002020',
    });

    console.log(
      'admin create:',
      this.userService.toView(data.user, UserViewType.PRIVATE),
    );
  }
}
