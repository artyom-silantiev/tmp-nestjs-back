import { Injectable, OnModuleInit } from '@nestjs/common';
import { EnvService } from '../env/env.service';
import * as fs from 'fs-extra';
import * as path from 'path';
import { S3Client, S3Service } from '@share/modules/s3/s3.service';
import { Bucket } from '@google-cloud/storage';
import { PrismaService } from '@db/prisma.service';

@Injectable()
export class ClearMediaFileService {
  private s3Content: S3Client;
  private highWindsBucket: Bucket;

  constructor(
    private env: EnvService,
    private prisma: PrismaService,
    private s3Service: S3Service,
  ) {}
}
