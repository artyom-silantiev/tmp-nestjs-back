import { Injectable } from "@nestjs/common";
import { IpfsStorageService } from "./ipfs-storage.service";
import { IpfsCacheService } from "./ipfs-cache.service";
import { IpfsOmsService } from "./ipfs-oms.service";
import { EnvService } from "../env/env.service";
import { Bs58Service } from "@share/modules/common/bs58.service";
import { Image, IpfsObject } from "@prisma/client";
import { StandardResult } from "@share/standard-result.class";
import { ImageService } from "@db/services/image.service";

import * as _ from "lodash";
import * as path from "path";
import * as fs from "fs-extra";

@Injectable()
export class IpfsIndexService {
  constructor(
    private env: EnvService,
    private bs58: Bs58Service,
    private imageService: ImageService,
    private ipfsStorage: IpfsStorageService,
    private ipfsCache: IpfsCacheService,
    private ipfsOms: IpfsOmsService
  ) {}

  async init(useIpfsCache = false) {
    await this.ipfsStorage.init();

    if (useIpfsCache) {
      await this.ipfsCache.init();
    }
  }

  async uploadImageByFile(imageFile: string) {
    const stdRes = new StandardResult<Image>();

    const ipfsObjectRes = await this.ipfsOms.createIpfsObjectFromFile(
      imageFile
    );

    let code = 201;
    let ipfsObject: IpfsObject;
    if (ipfsObjectRes.isGood) {
      code = ipfsObjectRes.code;
      ipfsObject = ipfsObjectRes.data;
    } else {
      return stdRes.setCode(code).setErrData({ errors: ipfsObjectRes.errData });
    }

    const image = await this.imageService.create(ipfsObject);

    return stdRes.setCode(code).setData(image);
  }

  async uploadImageByMulter(imageFile: Express.Multer.File) {
    const tempName = this.bs58.uuid();
    const tempFile = path.resolve(this.env.DIR_TEMP_FILES, tempName);
    await fs.writeFile(tempFile, imageFile.buffer);
    return this.uploadImageByFile(tempFile);
  }
}
