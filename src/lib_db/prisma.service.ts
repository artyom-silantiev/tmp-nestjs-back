import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { useAppWrap } from '@share/app-wrap';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.init();

    const app = useAppWrap().getApp();
    if (app) {
      this.enableShutdownHooks(app);
    }
  }

  async init() {
    try {
      await this.$connect();
    } catch (error) {
      throw error;
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
