import { Module } from '@nestjs/common';
import { I18NextService } from './i18next.service';
import { I18nModule, I18nJsonParser } from 'nestjs-i18n';
import * as path from 'path';
import { QueryResolver } from './resolver';
import { useEnv } from '@share/env/env';

@Module({
  imports: [
    I18nModule.forRootAsync({
      useFactory: () => {
        const env = useEnv();

        const i18nPath = path.join(process.cwd(), 'assets', 'i18n/');

        return {
          fallbackLanguage: 'en',
          parserOptions: {
            path: i18nPath,
          },
        };
      },
      parser: I18nJsonParser,
      resolvers: [{ use: QueryResolver, options: ['lang', 'locale', 'l'] }],
    }),
  ],
  providers: [I18NextService],
  exports: [I18NextService],
})
export class I18NextModule {}
