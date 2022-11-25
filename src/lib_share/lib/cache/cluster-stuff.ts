import { ClusterAppType } from '@share/lib/env/env';
import { useRedis } from '../redis';

class ClusterStuff {
  getAppChanName(appUid: string) {
    return `${appUid}@app`;
  }
  getClusterAppPrefix() {
    return `CApp:*`;
  }
  key(appType: ClusterAppType, appUid: string) {
    return `CApp:${appType}:${appUid}`;
  }
  async del(appType: ClusterAppType, appUid: string) {
    const cacheKey = this.key(appType, appUid);
    await useRedis().del(cacheKey);
  }
}

let clusterStuff: ClusterStuff;
export function useClusterStuff() {
  if (!clusterStuff) {
    clusterStuff = new ClusterStuff();
  }
  return clusterStuff;
}
