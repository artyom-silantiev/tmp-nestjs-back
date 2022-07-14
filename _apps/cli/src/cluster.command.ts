import { Command } from 'nestjs-command';
import { Injectable } from '@nestjs/common';
import {
  AppMessage,
  ClusterAppService,
} from '@share/modules/cluster-app/cluster-app.service';
import { RedisService } from '@share/modules/redis/redis.service';
import { createDeferred } from '@share/helpers';
import * as _ from 'lodash';
import { AppStatus } from './cluster.types';
import { TraefikConfig } from './traefik-config.class';
import { ClusterAppType, useEnv } from '@share/env/env';
@Injectable()
export class ClusterCommand {
  private env = useEnv();
  private cheksAppsResolves = {} as {
    [appUid: string]: (boolean) => void;
  };

  constructor(
    private cliClusterApp: ClusterAppService,
    private redis: RedisService,
  ) {}

  private async initCliClusterApp() {
    await this.cliClusterApp.initClusterApp(ClusterAppType.Cli);
    this.cliClusterApp.emitter.on('PONG', (appMessage: AppMessage) => {
      const appResolve = this.cheksAppsResolves[appMessage.from];
      if (appResolve) {
        appResolve(true);
      }
    });

    console.log('cli app uid: ', this.cliClusterApp.getUid());
  }

  private async checkClusterApp(appUid: string) {
    const deferrend = createDeferred<boolean>();
    this.cheksAppsResolves[appUid] = deferrend.resolve;

    await this.cliClusterApp.sendPingMessageTo(appUid);
    const timeout = 2000;

    setTimeout(() => {
      if (this.cheksAppsResolves[appUid]) {
        this.cheksAppsResolves[appUid](false);
      }
    }, timeout);

    return deferrend.promise;
  }

  private async getClusterApps() {
    const redisCli = this.redis.getClient();

    const clusterAppPrefix = this.redis.keys.getClusterAppPrefix();
    const clusterAppKeys = await redisCli.keys(clusterAppPrefix);
    const clusterAppsStatus = {} as {
      [appUid: string]: AppStatus;
    };
    const chekApps = [] as Promise<boolean>[];

    const check = async (appType: ClusterAppType, appUid: string) => {
      const result = await this.checkClusterApp(appUid);
      const appStatus = clusterAppsStatus[appUid];

      if (result) {
        const appInfo = await this.cliClusterApp.getAppInfoByTypeAndUid(
          appType,
          appUid,
        );

        if (!appInfo) {
          const clusterAppKey = this.redis.keys.getClusterAppKey(
            appType,
            appUid,
          );
          await redisCli.del(clusterAppKey);
          return false;
        }

        appStatus.status = true;
        clusterAppsStatus[appUid] = {
          ...appStatus,
          ...appInfo,
        };

        return true;
      }

      return false;
    };

    for (let i = clusterAppKeys.length - 1; i >= 0; i--) {
      const key = clusterAppKeys[i];
      const [, tmpAppType, appUid] = key.split(':');
      const appType = tmpAppType as ClusterAppType;

      if (appType === ClusterAppType.Cli) {
        continue;
      }
      clusterAppsStatus[appUid] = {
        status: false,
        type: appType,
        host: null,
        portHttp: null,
        uid: appUid,
      };

      chekApps.push(check(appType, appUid));
    }

    await Promise.all(chekApps);
    let clusterApps = [] as AppStatus[];

    for (const appUid of Object.keys(clusterAppsStatus)) {
      const appStatus = clusterAppsStatus[appUid];
      clusterApps.push({
        uid: appStatus.uid,
        type: appStatus.type,
        host: appStatus.host,
        portHttp: appStatus.portHttp,
        status: appStatus.status,
      });
    }

    clusterApps = _.sortBy(clusterApps, ['portHttp']);

    return clusterApps;
  }

  @Command({
    command: 'cluster:list',
  })
  async status() {
    await this.initCliClusterApp();
    const clusterApps = await this.getClusterApps();

    console.table(clusterApps);

    process.exit(0);
  }

  @Command({
    command: 'cluster:update_traefik_config',
  })
  async updateTraefikConfig() {
    await this.initCliClusterApp();
    const clusterApps = await this.getClusterApps();

    console.table(clusterApps);

    const traefikConfig = new TraefikConfig(clusterApps);
    await traefikConfig.generateTraefikConfig();

    process.exit(0);
  }
}
