import { Module } from '@nestjs/common';
import { RouterModule } from '@nestjs/core';

import { CommonModule } from './modules/common/common.module';
import { GuestModule } from './modules/guest/guest.module';
import { UserModule } from './modules/user/user.module';
import { IpfsRouteModule } from './modules/ipfs/ipfs.module';
import { LocalFilesRouteModule } from './modules/local_files/local_files.module';

import { useEnv } from '@share/lib/env/env';
import * as fs from 'fs-extra';
import {
  ServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';

@Module({
  imports: [
    CommonModule,
    UserModule,
    GuestModule,
    IpfsRouteModule,
    LocalFilesRouteModule,

    RouterModule.register([
      {
        path: 'api',
        module: CommonModule,
        children: [
          {
            path: 'user',
            module: UserModule,
          },
          {
            path: 'guest',
            module: GuestModule,
          },
        ],
      },
      {
        path: 'ipfs',
        module: IpfsRouteModule,
      },
      {
        path: 'local_files',
        module: LocalFilesRouteModule,
      },
    ]),

    ServeStaticModule.forRootAsync({
      useFactory: async () => {
        const env = useEnv();
        console.log(env.DIR_ASSETS_PUBLIC);

        const options = [
          {
            rootPath: env.DIR_ASSETS_PUBLIC,
            serveRoot: '/static_b',
          },
        ] as ServeStaticModuleOptions[];

        try {
          const stat = await fs.stat(env.DIR_FRONT_APP_MAIN);
          if (stat.isDirectory) {
            options.push({
              rootPath: env.DIR_FRONT_APP_MAIN,
              renderPath: '/*',
              // exclude: ['/content*', '/sha256*', '/api*', '/static_b'],
            });
          }
        } catch (error) {}

        return options;
      },
    }),
  ],
})
export class AppRouterModule {}
