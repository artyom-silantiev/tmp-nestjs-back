import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UserService } from './services/user.service';
import { JwtDbService } from './services/jwt-db.service';
import { TaskService } from './services/task.service';
import { IpfsObjectService } from './services/ipfs-object.service';
import { LocalFileService } from './services/local-file.service';
import { ImageService } from './services/image.service';
import { SettingService } from './services/setting.service';

@Module({
  providers: [
    PrismaService,
    SettingService,
    JwtDbService,
    TaskService,
    IpfsObjectService,
    LocalFileService,
    ImageService,
    UserService,
  ],
  exports: [
    PrismaService,
    SettingService,
    JwtDbService,
    TaskService,
    IpfsObjectService,
    LocalFileService,
    ImageService,
    UserService,
  ],
})
export class DbModule {}
