import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { IpfsStorageService } from './ipfs-storage.service';
import { IpfsCacheService } from './ipfs-cache.service';
import { Image, IpfsObject } from '@prisma/client';
import { StandardResult } from '@share/standard-result.class';
import { ImageService } from '@db/services/image.service';
import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { IpfsMakeService } from './ipfs-make.service';
import { useEnv } from '@share/lib/env/env';
import { useBs58 } from '@share/lib/bs58';

@Injectable()
export class IpfsInputService {
  private env = useEnv();
  private bs58 = useBs58();

  constructor(
    private imageService: ImageService,
    private ipfsStorage: IpfsStorageService,
    private ipfsCache: IpfsCacheService,
    @Inject(forwardRef(() => IpfsMakeService))
    private ipfsMake: IpfsMakeService,
  ) {}

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

    const image = await this.imageService.createByIpfsObject(ipfsObject);

    return stdRes.setCode(code).setData(image);
  }

  async uploadImageByMulterFile(imageFile: Express.Multer.File) {
    const tempName = this.bs58.uid();
    const tempFile = path.resolve(this.env.DIR_TEMP_FILES, tempName);
    await fs.writeFile(tempFile, imageFile.buffer);
    return this.uploadImageByFile(tempFile);
  }
}
