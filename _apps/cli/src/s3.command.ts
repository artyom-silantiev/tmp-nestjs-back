import { Command } from "nestjs-command";
import { Injectable } from "@nestjs/common";

import { S3Service } from "@share/modules/s3/s3.service";

@Injectable()
export class S3Command {
  constructor(private s3Service: S3Service) {}

  @Command({
    command: "s3:init",
  })
  async initS3() {
    await this.s3Service.init();

    const contentS3client = this.s3Service.getContentS3Client();
    const ipfsS3client = this.s3Service.getIpfsS3Client();

    console.log("contentS3client", contentS3client);
    console.log("ipfsS3client", ipfsS3client);

    process.exit(0);
  }
}
