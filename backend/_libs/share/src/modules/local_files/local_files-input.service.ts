import { Injectable } from '@nestjs/common';
import { EnvService } from '../env/env.service';
import { Image, LocalFile } from '@prisma/client';
import { StandardResult } from '@share/standard-result.class';
import { ImageService } from '@db/services/image.service';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { LocalFilesMakeService } from './local_files-make.service';
import { Bs58 } from '@share/bs58';

@Injectable()
export class LocalFilesInputService {
  constructor(
    private env: EnvService,
    private imageService: ImageService,
    private localFilesMake: LocalFilesMakeService,
  ) {}

  async init() {}

  async uploadImageByFile(imageFile: string) {
    const stdRes = new StandardResult<Image>();

    const localFileRes = await this.localFilesMake.createLocalFileByFile(
      imageFile,
    );

    let code = 201;
    let localFile: LocalFile;
    if (localFileRes.isGood) {
      code = localFileRes.code;
      localFile = localFileRes.data;
    } else {
      return stdRes.setCode(code).setErrData({ errors: localFileRes.errData });
    }

    const image = await this.imageService.createByLocalFile(localFile);

    return stdRes.setCode(code).setData(image);
  }

  async uploadImageByMulter(imageFile: Express.Multer.File) {
    const tempName = Bs58.uuid();
    const tempFile = path.resolve(this.env.DIR_TEMP_FILES, tempName);
    await fs.writeFile(tempFile, imageFile.buffer);
    return this.uploadImageByFile(tempFile);
  }
}
