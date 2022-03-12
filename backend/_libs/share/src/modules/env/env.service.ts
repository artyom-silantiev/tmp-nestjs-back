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

export enum ClusterAppType {
  Cli = 'cli',
  Web = 'web',
}

const E = process.env;

let onlyDefault = false;

const NODE_APP_INDEX = toInt(E.NODE_APP_INDEX, 0);
const NODE_APP_TYPE = toEnum(E.NODE_APP_TYPE, Object.values(ClusterAppType), ClusterAppType.Web);

@Injectable()
export class EnvService {
  NODE_APP_INDEX = NODE_APP_INDEX;
  NODE_APP_TYPE = NODE_APP_TYPE;
  NODE_ENV = toEnum(E.NODE_ENV, Object.values(NodeEnvType), NodeEnvType.development) as NodeEnvType;
  NODE_ROLE = toEnum(E.NODE_ROLE, Object.values(NodeRole), NodeRole.MASTER) as NodeRole;
  NODE_PORT = toInt(E.NODE_PORT, 3000, true);
  NODE_HOST = toString(E.NODE_HOST, 'localhost');
  NODE_PROTOCOL = toEnum(E.NODE_PROTOCOL, Object.values(Protocol), Protocol.http) as Protocol;

  SECRET_PASSWORD_SALT = toString(E.SECRET_PASSWORD_SALT, 'SECRET_PASSWORD_SALT');
  SECRET_JWT_AUTH = toString(E.SECRET_JWT_AUTH, 'jwtActivationSec');
  SECRET_JWT_ACTIVATION = toString(E.SECRET_JWT_ACTIVATION, 'jwtActivationSec');
  SECRET_JWT_RECOVERY = toString(E.JWT_RECOVERY_SECRET, 'jwtUserRecovery');

  JWT_AUTH_TTL_SEC = toInt(E.JWT_AUTH_TTL_SEC, 28800);
  JWT_ACTIVATION_TTL_SEC = toInt(E.JWT_ACTIVATION_TTL_SEC, 60 * 60 * 24 * 90);
  JWT_RECOVERY_TTL_SEC = toInt(E.JWT_RECOVERY_TTL_SEC, 60 * 60 * 8);

  DATABASE_URL = toString(E.DATABASE_URL, 'postgresql://postgres:postgres@localhost:5432/postgres?schema=public');

  DIR_TEMP_FILES = toPath(E.DIR_TEMP_FILES, './data/nodes/{NAF}/temp');
  DIR_IPFS_CACHE = toPath(E.DIR_IPFS_CACHE, './data/nodes/{NAF}/ipfs_cache');
  DIR_LOCAL_FILES = toPath(E.DIR_LOCAL_FILES, './data/nodes/{NAF}/local_files');
  DIR_FRONT_APP_MAIN = toPath(E.DIR_FRONT_APP_MAIN, './data/frontends/main');
  DIR_ASSETS_PUBLIC = toPath(E.DIR_ASSETS_PUBLIC, './assets/public');

  FRONT_MAIN_PROTOCOL = toEnum(E.FRONT_MAIN_PROTOCOL, Object.values(Protocol), Protocol.http) as Protocol;
  FRONT_MAIN_HOST = toString(E.FRONT_MAIN_HOST, 'example.com');
  FRONT_HIGHWINDS_HOST = toString(E.FRONT_HIGHWINDS_HOST, 'highwinds-dev.jesusstream.com');
  FRONT_BASE_URL = toString(E.FRONT_BASE_URL, 'http://localhost:3000');

  REDIS_HOST = toString(E.REDIS_HOST, 'localhost');
  REDIS_PORT = toInt(E.REDIS_PORT, 6379);
  REDIS_DB = toInt(E.REDIS_DB, 0);

  MAILER_SEND_EMAIL_TYPE = toEnum(E.MAILER_SEND_EMAIL_TYPE, Object.values(SendEmailType), SendEmailType.sync) as SendEmailType;
  MAILER_QUEUE_DELAY_SEC = toInt(E.MAILER_QUEUE_DELAY_SEC, 10);
  MAILER_QUEUE_ATTEMPTS = toInt(E.MAILER_QUEUE_ATTEMPTS, 3);
  MAILER_QUEUE_PACK_SIZE = toInt(E.MAILER_QUEUE_PACK_SIZE, 3);
  MAILER_DEFAULT_SENDER = toString(E.MAILER_DEFAULT_SENDER, 'Jesus Stream Support <noreply-dev@jesusstream.com>');
  MAILER_SMTP_HOST = toString(E.MAILER_SMTP_HOST, 'email-smtp.us-east-1.amazonaws.com');
  MAILER_SMTP_PORT = toInt(E.MAILER_SMTP_PORT, 587);
  MAILER_SMTP_ENCRYPTION = toString(E.MAILER_SMTP_IS_SECURE, 'tls');
  MAILER_SMTP_AUTH_USER = toString(E.MAILER_SMTP_AUTH_USER, 'AKIASHBDRVDDWJDRLBEO');
  MAILER_SMTP_AUTH_PASS = toString(E.MAILER_SMTP_AUTH_PASS, 'BMYz83dlWTvFEwX3D/aS0CrCWEylmID6ImfZM7wpkA2l');

  AWS_REGION = toString(E.AWS_REGION, 'us-east-1');
  AWS_S3_IS_LOCAL = toBool(E.AWS_S3_IS_LOCAL, true);
  AWS_S3_ACCESS_KEY = toString(E.AWS_S3_ACCESS_KEY, 'S3_ACCESS_KEY');
  AWS_S3_SECRET_KEY = toString(E.AWS_S3_SECRET_KEY, 'S3_SECRET_KEY');
  AWS_S3_ENDPOINT = toString(E.AWS_S3_ENDPOINT, 'http://127.0.0.1:9000');
  AWS_S3_BUCKET_NAME_IPFS = toString(E.AWS_S3_BUCKET_NAME_IPFS, 'ipfs');
  AWS_S3_BUCKET_NAME_CONTENT = toString(E.AWS_S3_BUCKET_NAME_CONTENT, 'content');

  IPFS_CACHE_DIR_SUFFIX_LENGTH = toInt(E.IPFS_CACHE_DIR_SUFFIX_LENGTH, 2);
  IPFS_CACHE_MIN_THUMB_LOG_SIZE = toInt(E.IPFS_CACHE_MIN_THUMB_LOG_SIZE, 5);
  IPFS_CACHE_MAX_ITEMS = toInt(E.IPFS_HOT_CACHE_MAX_ITEMS, 1000);
  IPFS_CACHE_MAX_SIZE = toInt(E.IPFS_CACHE_MAX_SIZE, 1024 * 1024 * 2048); // 2048 mb
  IPFS_IMAGE_MAX_SIZE = toInt(E.IPFS_IMAGE_MAX_SIZE, 1024 * 1024 * 8); // 8mb
  IPFS_IMAGE_ALLOW_MIME_TYPES = toArrayStrings(E.IPFS_IMAGE_ALLOW_MIME_TYPES, ',', ['image/jpeg', 'image/png', 'image/webp']);
  IPFS_AUDIO_MAX_SIZE = toInt(E.IPFS_VIDEO_MAX_SIZE, 1024 * 1024 * 20); // 20mb
  IPFS_AUDIO_ALLOW_MIME_TYPES = toArrayStrings(E.IPFS_VIDEO_ALLOW_MIME_TYPES, ',', ['audio/mp3']);
  IPFS_VIDEO_MAX_SIZE = toInt(E.IPFS_VIDEO_MAX_SIZE, 1024 * 1024 * 20); // 20mb
  IPFS_VIDEO_ALLOW_MIME_TYPES = toArrayStrings(E.IPFS_VIDEO_ALLOW_MIME_TYPES, ',', ['video/mp4']);

  // LOCAL_FILES
  LOCAL_FILES_IMAGE_MAX_SIZE = toInt(E.LOCAL_FILE_IMAGE_MAX_SIZE, 1024 * 1024 * 8); // 8mb
  LOCAL_FILES_ALLOW_MIME_TYPES = toArrayStrings(E.LOCAL_FILES_ALLOW_MIME_TYPES, ',', ['image/jpeg', 'image/png', 'image/webp']);
  LOCAL_FILES_AUDIO_MAX_SIZE = toInt(E.IPFS_VIDEO_MAX_SIZE, 1024 * 1024 * 20); // 20mb
  LOCAL_FILES_AUDIO_ALLOW_MIME_TYPES = toArrayStrings(E.IPFS_VIDEO_ALLOW_MIME_TYPES, ',', ['audio/mp3']);
  LOCAL_FILES_VIDEO_MAX_SIZE = toInt(E.LOCAL_FILES_VIDEO_MAX_SIZE, 1024 * 1024 * 20); // 20mb
  LOCAL_FILES_VIDEO_ALLOW_MIME_TYPES = toArrayStrings(E.LOCAL_FILES_VIDEO_ALLOW_MIME_TYPES, ',', ['video/mp4']);

  DAEMON_CLEAN_DB_DELAY_MIN = toInt(E.DAEMON_CLEAN_DB_DELAY_MIN, 60);

  TRAEFIK_ENDPOINTS = toArrayStrings(E.TRAEFIK_ENDPOINTS, ',', ['web']);
  TRAEFIK_DOMAIN_WEB = toString(E.TRAEFIK_DOMAIN_WEB, 'web.example.com');
  TRAEFIK_ACME_ENABLED = toBool(E.TRAEFIK_ACME_ENABLED, false);
  TRAEFIK_ACME_EMAIL = toString(E.TRAEFIK_ACME_EMAIL, 'test@example.com');

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

  getDefaultEnv() {
    onlyDefault = true;
    const defaultEnv = new EnvService();
    onlyDefault = false;
    return defaultEnv;
  }
}

export function toString(envParam: string, defaultValue: string) {
  if (onlyDefault) {
    return defaultValue;
  }
  return envParam ? envParam : defaultValue;
}

export function toInt(envParam: string, defaultValue: number, isIncrement = false) {
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

  if (onlyDefault) {
    resValue = defaultValue;
  }

  if (isIncrement) {
    resValue += NODE_APP_INDEX;
  }

  return resValue;
}

export function toBool(envParam: string, defaultValue: boolean) {
  if (onlyDefault) {
    return defaultValue;
  }
  if (envParam === '0' || envParam === 'false') {
    return false;
  } else if (envParam === '1' || envParam === 'true') {
    return true;
  } else {
    return defaultValue;
  }
}

export function toEnum(envParam: string, enumValues: string[], defaultValue: string) {
  if (onlyDefault) {
    return defaultValue;
  }
  return enumValues.indexOf(envParam) >= 0 ? envParam : defaultValue;
}

export function toArrayStrings(envParam: string, spliter: string, defaultValue: string[]) {
  if (onlyDefault) {
    return defaultValue;
  }
  if (envParam) {
    try {
      const values = envParam.split(spliter);
      return values;
    } catch (error) {}
  }
  return defaultValue;
}

export function _parsePath(pathParam: string) {
  if (_.startsWith(pathParam, './') || _.startsWith(pathParam, '../')) {
    return path.resolve(process.cwd(), pathParam);
  } else if (_.startsWith(pathParam, '/')) {
    return pathParam;
  } else {
    return null;
  }
}
export function toPath(envParam: string, defaultPathValue: string) {
  if (onlyDefault) {
    return defaultPathValue;
  }

  let path = '';

  if (envParam) {
    const tmp = _parsePath(envParam);
    if (tmp) {
      path = tmp;
    } else {
      path = _parsePath(defaultPathValue);
    }
  } else {
    path = _parsePath(defaultPathValue);
  }

  const NAI = NODE_APP_INDEX.toString();
  const NAT = NODE_APP_TYPE;
  const NAF = NAT + '_' + NAI;

  path = path.replaceAll('{NAI}', NAI);
  path = path.replaceAll('{NAT}', NAT);
  path = path.replaceAll('{NAF}', NAF);

  return path;
}
