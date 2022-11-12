import { DynamicModule, Module } from '@nestjs/common';
import {
  ServeStaticModule,
  ServeStaticModuleOptions,
} from '@nestjs/serve-static';
import { useEnv } from '@share/rlib/env/env';
import * as fs from 'fs-extra';

@Module({})
export class StaticContentModule {
  static register(): DynamicModule {
    return ServeStaticModule.forRootAsync({
      useFactory: async () => {
        const env = useEnv();

        console.log(env.DIR_ASSETS_PUBLIC);

        const options = [
          {
            rootPath: env.DIR_ASSETS_PUBLIC,
            serveRoot: '/static_b',
          },
        ] as ServeStaticModuleOptions[];

        /*
        try {
          const stat = await fs.stat(env.DIR_FRONT_APP_SOME);
          if (stat.isDirectory) {
            options.push({
              rootPath: env.DIR_FRONT_APP_SOME,
              serveRoot: '/some',
            });
          }
        } catch (error) {}
        */

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
    });
  }
}
