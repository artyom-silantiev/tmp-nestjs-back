import { INestApplication, INestApplicationContext } from '@nestjs/common';
import { DbModule } from './db.module';
import { PrismaService } from './prisma.service';

export async function appUsePrisma(
  appContext: INestApplicationContext,
  app?: INestApplication,
) {
  const prismaService = appContext.select(DbModule).get(PrismaService);
  await prismaService.init();

  if (app) {
    await prismaService.enableShutdownHooks(app);
  }
}
