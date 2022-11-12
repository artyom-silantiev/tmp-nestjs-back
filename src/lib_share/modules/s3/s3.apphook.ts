import { INestApplicationContext } from '@nestjs/common';
import { S3Module } from './s3.module';
import { S3Service } from './s3.service';

export async function appUseS3(appContext: INestApplicationContext) {
  const s3 = appContext.select(S3Module).get(S3Service);
  await s3.init();
}
