import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as _ from 'lodash';

export enum NodeEnvType {
  development = 'development',
  production = 'production',
}

export enum NodeRole {
  MASTER = 'MASTER',
  WORKER = 'WORKER',
}

export enum SendEmailType {
  sync = 'sync',
  queue = 'queue',
}

export enum Protocol {
  http = 'http',
  https = 'https',
}

const env = process.env;

const NODE_APP_INDEX = toInt(env.NODE_APP_INDEX, 0);

@Injectable()
export class EnvService {
  NODE_APP_INDEX = NODE_APP_INDEX;
  NODE_ENV = toEnum(
    env.NODE_ENV,
    Object.values(NodeEnvType),
    NodeEnvType.development,
  ) as NodeEnvType;
  NODE_ROLE = toEnum(
    env.NODE_ROLE,
    Object.values(NodeRole),
    NodeRole.MASTER,
  ) as NodeRole;
  NODE_PORT = toInt(env.NODE_PORT, 3000, true);
  NODE_HOST = toString(env.NODE_HOST, 'localhost');
  NODE_PROTOCOL = toEnum(
    env.NODE_PROTOCOL,
    Object.values(Protocol),
    Protocol.http,
  ) as Protocol;

  PASSWORD_SALT = toString(env.PASSWORD_SALT, 'passwordSalt');

  // JWT_AUTH
  JWT_AUTH_SECRET = toString(env.JWT_AUTH_SECRET, 'jwtAuthSecret');
  JWT_AUTH_TTL_SEC = toInt(env.JWT_AUTH_TTL_SEC, 28800);
  // JWT_ACTIVATION
  JWT_ACTIVATION_SECRET = toString(
    env.JWT_ACTIVATION_SECRET,
    'jwtActivationSecret',
  );
  JWT_ACTIVATION_TTL_SEC = toInt(env.JWT_ACTIVATION_TTL_SEC, 60 * 60 * 24 * 90);
  // JWT_RECOVERY
  JWT_RECOVERY_SECRET = toString(env.JWT_RECOVERY_SECRET, 'jwtUserRecovery');
  JWT_RECOVERY_TTL_SEC = toInt(env.JWT_RECOVERY_TTL_SEC, 60 * 60 * 8);

  DATABASE_URL = toString(
    env.DATABASE_URL,
    'mysql://root:root@localhost:3306/dbname',
  );

  DIR_TEMP_FILES = toPath(env.DIR_TEMP_FILES, './data/temp');
  DIR_FRONT_APP_MAIN = toPath(env.DIR_FRONT_APP_MAIN, './data/frontends/main');
  DIR_ASSETS_PUBLIC = toPath(env.DIR_ASSETS_PUBLIC, './assets/public');

  REDIS_HOST = toString(env.REDIS_HOST, 'localhost');
  REDIS_PORT = toInt(env.REDIS_PORT, 6379);
  REDIS_DB = toInt(env.REDIS_DB, 0);

  MAILER_SEND_EMAIL_TYPE = toEnum(
    env.MAILER_SEND_EMAIL_TYPE,
    Object.values(SendEmailType),
    SendEmailType.sync,
  ) as SendEmailType;
  MAILER_QUEUE_DELAY_SEC = toInt(env.MAILER_QUEUE_DELAY_SEC, 10);
  MAILER_QUEUE_ATTEMPTS = toInt(env.MAILER_QUEUE_ATTEMPTS, 3);
  MAILER_QUEUE_PACK_SIZE = toInt(env.MAILER_QUEUE_PACK_SIZE, 3);
  MAILER_DEFAULT_SENDER = toString(
    env.MAILER_DEFAULT_SENDER,
    'Jesus Stream Support <noreply-dev@jesusstream.com>',
  );
  MAILER_SMTP_HOST = toString(
    env.MAILER_SMTP_HOST,
    'email-smtp.us-east-1.amazonaws.com',
  );
  MAILER_SMTP_PORT = toInt(env.MAILER_SMTP_PORT, 587);
  MAILER_SMTP_ENCRYPTION = toString(env.MAILER_SMTP_IS_SECURE, 'tls');
  MAILER_SMTP_AUTH_USER = toString(
    env.MAILER_SMTP_AUTH_USER,
    'AKIASHBDRVDDWJDRLBEO',
  );
  MAILER_SMTP_AUTH_PASS = toString(
    env.MAILER_SMTP_AUTH_PASS,
    'BMYz83dlWTvFEwX3D/aS0CrCWEylmID6ImfZM7wpkA2l',
  );

  AWS_S3_IS_LOCAL = toBool(env.AWS_S3_IS_LOCAL, true);
  AWS_S3_ACCESS_KEY = toString(env.AWS_S3_ACCESS_KEY, 'S3_ACCESS_KEY');
  AWS_S3_SECRET_KEY = toString(env.AWS_S3_SECRET_KEY, 'S3_SECRET_KEY');
  AWS_S3_ENDPOINT = toString(env.AWS_S3_ENDPOINT, 'http://127.0.0.1:9000');
  AWS_S3_BUCKET_NAME_IPFS = toString(env.AWS_S3_BUCKET_NAME_IPFS, 'ipfs');
  AWS_S3_BUCKET_NAME_CONTENT = toString(
    env.AWS_S3_BUCKET_NAME_CONTENT,
    'content',
  );

  IPFS_CACHE_DIR = toPath(env.IPFS_HOT_CACHE_DIR, './data/ipfs_cache');
  IPFS_CACHE_DIR_SUFFIX_LENGTH = toInt(env.IPFS_CACHE_DIR_SUFFIX_LENGTH, 2);
  IPFS_CACHE_MIN_THUMB_LOG_SIZE = toInt(env.IPFS_CACHE_MIN_THUMB_LOG_SIZE, 5);
  IPFS_CACHE_MAX_ITEMS = toInt(env.IPFS_HOT_CACHE_MAX_ITEMS, 1000);
  IPFS_CACHE_MAX_SIZE = toInt(env.IPFS_CACHE_MAX_SIZE, 1024 * 1024 * 2048); // 2048 mb
  IPFS_IMAGE_MAX_SIZE = toInt(env.IPFS_IMAGE_MAX_SIZE, 1024 * 1024 * 8); // 8mb
  IPFS_IMAGE_ALLOW_MIME_TYPES = toArrayStrings(
    env.IPFS_IMAGE_ALLOW_MIME_TYPES,
    ',',
    ['image/jpeg', 'image/png', 'image/webp'],
  );
  IPFS_VIDEO_MAX_SIZE = toInt(env.IPFS_VIDEO_MAX_SIZE, 1024 * 1024 * 20); // 20mb
  IPFS_VIDEO_ALLOW_MIME_TYPES = toArrayStrings(
    env.IPFS_VIDEO_ALLOW_MIME_TYPES,
    ',',
    ['video/mp4'],
  );

  DAEMON_CLEAN_DB_DELAY_MIN = toInt(env.DAEMON_CLEAN_DB_DELAY_MIN, 60);

  TRAEFIK_HOST_MAIN = toString(env.TRAEFIK_HOST_MAIN, 'jwc.example.com');
  TRAEFIK_HOST_CDN = toString(env.TRAEFIK_HOST_CDN, 'cdn.example.com');
  TRAEFIK_ACME_ENABLED = toBool(env.TRAEFIK_ACME_ENABLED, false);
  TRAEFIK_ACME_EMAIL = toString(env.TRAEFIK_ACME_EMAIL, 'test@example.com');

  isDevEnv() {
    return this.NODE_ENV === NodeEnvType.development;
  }

  isMasterNode() {
    return this.NODE_ROLE === NodeRole.MASTER;
  }

  private getBaseProtocol(protocol: Protocol) {
    if (protocol === Protocol.http) {
      return 'http:';
    } else {
      return 'https:';
    }
  }

  getNodeProtocol() {
    return this.getBaseProtocol(this.NODE_PROTOCOL);
  }
}

function toString(envParam: string, defaultValue: string) {
  return envParam ? envParam : defaultValue;
}

function toInt(envParam: string, defaultValue: number, isIncrement = false) {
  let resValue = 0;

  if (envParam) {
    const tmp = parseInt(envParam);
    if (Number.isInteger(tmp)) {
      resValue = tmp;
    } else {
      resValue = defaultValue;
    }
  } else {
    resValue = defaultValue;
  }

  if (isIncrement) {
    resValue += NODE_APP_INDEX;
  }

  return resValue;
}

function toBool(envParam: string, defaultValue: boolean) {
  if (envParam === '0' || envParam === 'false') {
    return false;
  } else if (envParam === '1' || envParam === 'true') {
    return true;
  } else {
    return defaultValue;
  }
}

function toEnum(envParam: string, enumValues: string[], defaultValue: string) {
  return enumValues.indexOf(envParam) >= 0 ? envParam : defaultValue;
}

function toArrayStrings(
  envParam: string,
  spliter: string,
  defaultValue: string[],
) {
  if (envParam) {
    try {
      const values = envParam.split(spliter);
      return values;
    } catch (error) {}
  }
  return defaultValue;
}

function _parsePath(pathParam: string) {
  if (_.startsWith(pathParam, './') || _.startsWith(pathParam, '../')) {
    return path.resolve(process.cwd(), pathParam);
  } else if (_.startsWith(pathParam, '/')) {
    return pathParam;
  } else {
    return null;
  }
}
function toPath(envParam: string, defaultPathValue) {
  if (envParam) {
    const tmp = _parsePath(envParam);
    if (tmp) {
      return tmp;
    } else {
      return _parsePath(defaultPathValue);
    }
  } else {
    return _parsePath(defaultPathValue);
  }
}
