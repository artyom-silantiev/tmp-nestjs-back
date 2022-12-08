import { Injectable } from '@nestjs/common';
import { Image, LocalFile } from '@prisma/client';
import { StandardResult } from '@share/standard-result.class';
import { ImageRepository } from '@db/repositories/image.repository';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { LocalFilesMakeService } from './local_files-make.service';
import { useEnv } from '@share/lib/env/env';
import { useBs58 } from '@share/lib/bs58';

@Injectable()
export class LocalFilesInputService {
  private env = useEnv();
  private bs58 = useBs58();

  constructor(
    private imageRepository: ImageRepository,
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

    const image = await this.imageRepository.createByLocalFile(localFile);

    return stdRes.setCode(code).setData(image);
  }

  async uploadImageByMulter(imageFile: Express.Multer.File) {
    const tempName = this.bs58.uid();
    const tempFile = path.resolve(this.env.DIR_TEMP_FILES, tempName);
    await fs.writeFile(tempFile, imageFile.buffer);
    return this.uploadImageByFile(tempFile);
  }
}
