import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import { NodeEnvType } from '@share/modules/env/env.service';
import * as prompts from 'prompts';
import * as fs from 'fs-extra';
import * as path from 'path';
import { Env, useEnv } from '@share/env/env';
import { useBs58 } from '@share/bs58';

const bs58 = useBs58();
@Injectable()
export class EnvCommand {
  private env = useEnv();

  private getEnvLines(env: Env) {
    let curKeyPrefix = '';
    const lines = [] as string[];
    for (const envKey of Object.keys(env)) {
      const kind = env[envKey];

      if (typeof kind === 'function') {
        continue;
      }

      const parts = envKey.split('_');
      const keyPrefix = parts[0];
      if (!curKeyPrefix) {
        curKeyPrefix = keyPrefix;
      }
      if (curKeyPrefix !== keyPrefix) {
        lines.push('');
      }
      curKeyPrefix = keyPrefix;

      lines.push(`${envKey}=${kind}`);
    }
    return lines;
  }

  @Command({
    command: 'env:print_default',
  })
  async envPrintDefault() {
    const envDefault = this.env.getDefaultEnv();

    const envLines = this.getEnvLines(envDefault);
    for (const line of envLines) {
      console.log(line);
    }

    process.exit(0);
  }

  private async envSetupBase(env: Env) {
    console.log('base env params...');
    const res = await prompts([
      {
        type: 'select',
        name: 'envType',
        message: 'Select env type',
        choices: [
          {
            title: 'development',
            value: NodeEnvType.development,
          },
          {
            title: 'production',
            value: NodeEnvType.production,
          },
        ],
        initial: 0,
      },
    ]);
    env.NODE_ENV = res.envType;

    console.log();
  }

  private async envSetupSecrets(env: Env) {
    env.SECRET_PASSWORD_SALT = bs58.getRandomBs58String(32);
    env.SECRET_JWT_AUTH = bs58.getRandomBs58String(32);
    env.SECRET_JWT_ACTIVATION = bs58.getRandomBs58String(32);
    env.SECRET_JWT_RECOVERY = bs58.getRandomBs58String(32);
  }

  private async envSetupDb(env: Env) {
    console.log('db env params...');
    const res = await prompts([
      {
        type: 'text',
        name: 'dbHost',
        message: 'What DB host?',
        initial: 'localhost',
      },
      {
        type: 'number',
        name: 'dbPort',
        message: 'What DB port?',
        initial: '3306',
      },
      {
        type: 'text',
        name: 'dbName',
        message: 'What DB name',
        initial: 'dbname',
      },
      {
        type: 'text',
        name: 'dbUser',
        message: 'What DB user name?',
        initial: 'root',
      },
      {
        type: 'text',
        name: 'dbPass',
        message: 'What DB password?',
        initial: 'root',
      },
    ]);
    const dbUrl = `mysql://${res.dbUser}:${res.dbPass}@${res.dbHost}:${res.dbPort}/${res.dbName}`;
    env.DATABASE_URL = dbUrl;

    console.log();
  }

  private async envSetupDns(env: Env) {
    console.log();
    console.log('dns env params...');

    const res = await prompts([
      {
        type: 'text',
        name: 'domainWeb',
        message: 'What web domain name?',
        initial: 'web.example.com',
      },
      {
        type: 'confirm',
        name: 'dnsTraefikAcmeEnabled',
        message: 'Is traefik acme enabled?',
        initial: true,
      },
      {
        type: 'text',
        name: 'dnsTraefikAcmeEmail',
        message: 'What traefik acme email?',
        initial: 'test@example.com',
      },
      {
        type: 'text',
        name: 'dnsRtmpHost',
        message: 'What traefik host?',
        initial: 'localhost',
      },
    ]);

    env.FRONT_MAIN_HOST = res.domainWeb;
    env.FRONT_BASE_URL = `https://${res.domainWeb}`;

    env.TRAEFIK_DOMAIN_WEB = res.domainWeb;
    env.TRAEFIK_ACME_EMAIL = res.dnsTraefikAcmeEnabled;
    env.TRAEFIK_ACME_EMAIL = res.dnsTraefikAcmeEmail;

    console.log();
  }

  private async envSetupRedis(env: Env) {
    console.log();
    console.log('redis env params...');
    const res = await prompts([
      {
        type: 'text',
        name: 'host',
        message: 'What redis host?',
        initial: 'localhost',
      },
      {
        type: 'number',
        name: 'port',
        message: 'What redis port?',
        initial: '6379',
      },
      {
        type: 'number',
        name: 'db',
        message: 'What redis db?',
        initial: '0',
      },
    ]);
    env.REDIS_HOST = res.host;
    env.REDIS_PORT = res.port;
    env.REDIS_DB = res.db;

    console.log();
  }

  private async envSetupAwsS3(env: Env) {
    console.log('aws/s3 env params...');
    const res = await prompts([
      {
        type: 'text',
        name: 'awsRegion',
        message: 'What AWS region?',
        initial: 'us-east-1',
      },
      {
        type: 'text',
        name: 's3accessKey',
        message: 'What s3 access key?',
        initial: 'S3_ACCESS_KEY',
      },
      {
        type: 'text',
        name: 's3secretKey',
        message: 'What s3 secret key?',
        initial: 'S3_SECRET_KEY',
      },
      {
        type: 'text',
        name: 's3BucketNameIpfs',
        message: 'What s3 ipfs bucket name?',
        initial: 'jesv2-ipfs',
      },
      {
        type: 'text',
        name: 's3BucketNameProcessing',
        message: 'What s3 processing bucket name?',
        initial: 'jesv2-processing',
      },
      {
        type: 'confirm',
        name: 's3isLocal',
        message: 'Is local s3?',
        initial: false,
      },
    ]);

    env.AWS_REGION = res.awsRegion;
    env.AWS_S3_ACCESS_KEY = res.s3accessKey;
    env.AWS_S3_SECRET_KEY = res.s3secretKey;
    env.AWS_S3_BUCKET_NAME_IPFS = res.s3BucketNameIpfs;

    if (res.s3isLocal) {
      const res = await prompts([
        {
          type: 'text',
          name: 's3EndPointHost',
          message: 'What s3 end point host?',
          initial: '127.0.0.1',
        },
        {
          type: 'number',
          name: 's3EndPointPort',
          message: 'What s3 end point host?',
          initial: 9000,
        },
      ]);
      const s3EndPoint = `http://${res.s3EndPointHost}:${res.s3EndPointPort}`;
      env.AWS_S3_ENDPOINT = s3EndPoint;
    }

    console.log();
  }

  @Command({
    command: 'env:setup',
  })
  async envSetup() {
    const env = this.env.getDefaultEnv();
    const cwd = process.cwd();
    const envFile = path.resolve(cwd, '.env');

    try {
      const envFileStat = await fs.stat(envFile);
      if (envFileStat) {
        console.log('.env file is exists');
        return;
      }
    } catch {}

    await this.envSetupBase(env);
    await this.envSetupSecrets(env);
    await this.envSetupDb(env);
    await this.envSetupRedis(env);
    await this.envSetupAwsS3(env);
    await this.envSetupDns(env);

    const envLines = this.getEnvLines(env);
    console.log();
    console.log(envFile, 'created:');
    await fs.writeFile(envFile, envLines.join('\n') + '\n');
    for (const line of envLines) {
      console.log(line);
    }

    process.exit(0);
  }
}
