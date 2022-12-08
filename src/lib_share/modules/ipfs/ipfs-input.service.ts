import { forwardRef, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { IpfsStorageService } from './ipfs-storage.service';
import { IpfsCacheService } from './ipfs-cache.service';
import { Image, IpfsObject } from '@prisma/client';
import { StandardResult } from '@share/standard-result.class';
import { ImageRepository } from '@db/repositories/image.repository';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { IpfsMakeService } from './ipfs-make.service';
import { useEnv } from '@share/lib/env/env';
import { useBs58 } from '@share/lib/bs58';

@Injectable()
export class IpfsInputService implements OnModuleInit {
  private env = useEnv();
  private bs58 = useBs58();

  constructor(
    private imageRepository: ImageRepository,
    private ipfsStorage: IpfsStorageService,
    private ipfsCache: IpfsCacheService,
    @Inject(forwardRef(() => IpfsMakeService))
    private ipfsMake: IpfsMakeService,
  ) {}

  async onModuleInit() {
    await this.init();
  }

  async init() {
    await this.ipfsStorage.init();
    await this.ipfsCache.init();
  }

  async uploadImageByFile(imageFile: string) {
    const stdRes = new StandardResult<Image>();

    const ipfsObjectRes = await this.ipfsMake.createIpfsObjectFromFile(
      imageFile,
    );

    let code = 201;
    let ipfsObject: IpfsObject;
    if (ipfsObjectRes.isGood) {
      code = ipfsObjectRes.code;
      ipfsObject = ipfsObjectRes.data;
    } else {
      return stdRes.setCode(code).setErrData({ errors: ipfsObjectRes.errData });
    }

    const image = await this.imageRepository.createByIpfsObject(ipfsObject);

    return stdRes.setCode(code).setData(image);
  }

  async uploadImageByMulterFile(imageFile: Express.Multer.File) {
    const tempName = this.bs58.uid();
    const tempFile = path.resolve(this.env.DIR_TEMP_FILES, tempName);
    await fs.writeFile(tempFile, imageFile.buffer);
    return this.uploadImageByFile(tempFile);
  }
}
