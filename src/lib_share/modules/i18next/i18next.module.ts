import { Module } from '@nestjs/common';
import { I18NextService } from './i18next.service';
import { I18nModule, AcceptLanguageResolver } from 'nestjs-i18n';
import * as path from 'path';
import { QueryResolver } from './resolver';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(process.cwd(), 'assets', 'i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'locale', 'l'] },
        AcceptLanguageResolver,
      ],
    }),
  ],
  providers: [I18NextService],
  exports: [I18NextService],
})
export class I18NextModule {}
