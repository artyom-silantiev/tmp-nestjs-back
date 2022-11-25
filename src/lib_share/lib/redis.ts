import Redis from 'ioredis';
import { useEnv } from './env/env';
const env = useEnv();

function createClient() {
  let newClient = new Redis({
    port: env.REDIS_PORT,
    host: env.REDIS_HOST,
    db: env.REDIS_DB,
  });
  return newClient;
}

const defaultClient = createClient();
const defaultClientPubSub = createClient();
const clients = {} as { [key: string]: Redis };

export function useRedis() {
  return defaultClient;
}

export function useRedisPubSub() {
  return defaultClientPubSub;
}

export async function useRedisByName(name: string) {
  if (clients[name]) {
    return clients[name];
  } else {
    this.clients[name] = await createClient();
    return clients[name];
  }
}
