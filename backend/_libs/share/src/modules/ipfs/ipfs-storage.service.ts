import { Injectable } from "@nestjs/common";
import { S3Client, S3Service } from "@share/modules/s3/s3.service";

@Injectable()
export class IpfsStorageService {
  private isInit = false;

  public s3Client: S3Client;

  constructor(private s3Serive: S3Service) {}

  async init() {
    if (this.isInit) {
      return;
    }

    await this.s3Serive.init();
    this.s3Client = await this.s3Serive.getIpfsS3Client();

    this.isInit = true;
  }
}
