import { Injectable, OnModuleInit } from '@nestjs/common';
import * as aws from 'aws-sdk';
import { StandardResult } from '@share/standard-result.class';
import * as fs from 'fs-extra';
import { S3 } from 'aws-sdk';
import { useEnv } from '@share/rlib/env/env';

export type S3ClientParams = {
  isLocal: boolean;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  endPoint: string;
};

export class S3Client {
  private isInit = false;
  private s3: aws.S3;
  private S3_BUCKET_NAME: string;

  constructor(s3: aws.S3, bucketName: string) {
    this.s3 = s3;
    this.S3_BUCKET_NAME = bucketName;
  }

  async init() {
    if (this.isInit) {
      return;
    }

    let bucketHead;
    let resError;

    try {
      bucketHead = await this.s3
        .headBucket({ Bucket: this.S3_BUCKET_NAME })
        .promise();
    } catch (error) {
      resError = error;
    }
    if (!bucketHead) {
      try {
        await this.s3
          .createBucket({
            Bucket: this.S3_BUCKET_NAME,
          })
          .promise();
      } catch (error) {
        console.error(error);
        resError = error;
      }

      try {
        bucketHead = await this.s3
          .headBucket({ Bucket: this.S3_BUCKET_NAME })
          .promise();
      } catch (error) {
        resError = error;
      }
    }

    if (!bucketHead) {
      console.error(resError);
      throw new Error('s3 is not init!');
    } else {
      this.isInit = true;
    }
  }

  async objectUpload(file: string, key: string) {
    const res = new StandardResult<string>();

    await new Promise((resolve, reject) => {
      const rs = fs.createReadStream(file);
      const params = {
        Bucket: this.S3_BUCKET_NAME,
        Body: rs,
        Key: key,
      };

      this.s3.upload(params, (err, data) => {
        if (err) {
          res.setErrData(err, 500);
          return resolve(1);
        }
        resolve(1);
      });
    });

    return res;
  }

  async getObjectsList(prefix: string) {
    const stdRes = new StandardResult<S3.ListObjectsOutput>();

    const params = {
      Bucket: this.S3_BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 10000,
    };

    await new Promise((resolve, reject) => {
      this.s3
        .listObjects(params)
        .on('error', (err) => {
          stdRes.setCode(500).setErrData(err.stack);
          resolve(1);
        })
        .on('success', (res) => {
          const resData = res.data as S3.ListObjectsOutput;
          if (resData) {
            stdRes.setCode(res.httpResponse.statusCode).setData(resData);
            resolve(1);
          } else {
            stdRes.setCode(500);
          }
        })
        .send();
    });

    return stdRes;
  }

  async objectExists(key: string) {
    const stdRes = new StandardResult<string>();

    const params = {
      Bucket: this.S3_BUCKET_NAME,
      Key: key,
    };

    await new Promise((resolve, reject) => {
      this.s3
        .headObject(params)
        .on('error', (err) => {
          stdRes.setCode(500).setErrData(err.stack);
          resolve(1);
        })
        .on('success', (res) => {
          stdRes.setCode(res.httpResponse.statusCode);
          resolve(1);
        })
        .send();
    });

    return stdRes;
  }

  async objectDownloadToFile(key: string, file: string) {
    const stdRes = new StandardResult<string>();

    const objectExistsRes = await this.objectExists(key);
    if (objectExistsRes.isBad) {
      return stdRes.mergeBad(objectExistsRes);
    }

    await new Promise((resolve, reject) => {
      const params = {
        Bucket: this.S3_BUCKET_NAME,
        Key: key,
      };

      let isError = false;
      const ws = fs.createWriteStream(file);
      const rs = this.s3.getObject(params).createReadStream();
      rs.pipe(ws);

      rs.on('error', (error) => {
        isError = true;
        stdRes.setCode(500).setErrData(error.stack);
        resolve(isError);
      });
      ws.on('error', (err) => {
        isError = true;
        stdRes.setCode(500).setErrData(err.stack);
        resolve(isError);
      });
      ws.on('close', async () => {
        if (!isError) {
          resolve(isError);
        }
      });
    });

    return stdRes;
  }

  async deleteObject(key: string) {
    const stdRes = new StandardResult<string>();

    const objectExistsRes = await this.objectExists(key);
    if (objectExistsRes.isBad) {
      return stdRes.mergeBad(objectExistsRes);
    }

    const params = {
      Bucket: this.S3_BUCKET_NAME,
      Key: key,
    };

    try {
      await this.s3.deleteObject(params).promise();
    } catch (error) {
      return stdRes.setCode(500).setErrData(error.stack);
    }

    return stdRes;
  }

  async emptyS3Directory(dir: string) {
    const listParams = {
      Bucket: this.S3_BUCKET_NAME,
      Prefix: dir,
    };

    const listedObjects = await this.s3.listObjectsV2(listParams).promise();

    if (listedObjects.Contents.length === 0) {
      return;
    }

    const deleteParams = {
      Bucket: this.S3_BUCKET_NAME,
      Delete: { Objects: [] },
    };

    listedObjects.Contents.forEach(({ Key }) => {
      deleteParams.Delete.Objects.push({ Key });
    });

    await this.s3.deleteObjects(deleteParams).promise();

    if (listedObjects.IsTruncated) {
      await this.emptyS3Directory(dir);
    }
  }
}

@Injectable()
export class S3Service implements OnModuleInit {
  private env = useEnv();
  private baseS3: aws.S3;
  private ipfsS3Client: S3Client;
  private isInit = false;

  onModuleInit() {
    this.init();
  }

  async init() {
    if (this.isInit) {
      return;
    }
    this.isInit = true;

    const s3Config = {} as aws.S3.ClientConfiguration;

    if (this.env.AWS_S3_IS_LOCAL) {
      if (this.env.AWS_S3_ACCESS_KEY && this.env.AWS_S3_SECRET_KEY) {
        s3Config.accessKeyId = this.env.AWS_S3_ACCESS_KEY;
        s3Config.secretAccessKey = this.env.AWS_S3_SECRET_KEY;
      }

      if (this.env.AWS_S3_ENDPOINT) {
        s3Config.endpoint = this.env.AWS_S3_ENDPOINT;
        s3Config.s3ForcePathStyle = true;
        s3Config.signatureVersion = 'v4';
      }
    }

    this.baseS3 = new aws.S3(s3Config);

    this.ipfsS3Client = new S3Client(
      this.baseS3,
      this.env.AWS_S3_BUCKET_NAME_IPFS,
    );

    await this.ipfsS3Client.init();
  }

  getIpfsS3Client() {
    return this.ipfsS3Client;
  }
}
