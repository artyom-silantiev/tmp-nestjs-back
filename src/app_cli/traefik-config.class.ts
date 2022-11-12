import * as fs from 'fs-extra';
import * as path from 'path';
import * as YAML from 'json-to-pretty-yaml';
import { AppStatus } from './cluster.types';
import { IpfsRanges } from '@share/modules/ipfs/ipfs-ranges';
import { ClusterAppType, useEnv } from '@share/rlib/env/env';

const TRAEFIK_DIR = path.resolve('./traefik');
const TRAEFIK_PROVIDERS_DIR = path.resolve(TRAEFIK_DIR, 'providers');
const TRAEFIK_CONF = path.resolve(TRAEFIK_DIR, 'traefik.yml');
const TRAEFIK_PROVIDER_WEB = path.resolve(TRAEFIK_PROVIDERS_DIR, 'web.yml');
const TRAEFIK_ACME_JSON = path.resolve(TRAEFIK_DIR, 'acme.json');

const EpWeb = 'EpWeb';
const EpWebS = 'EpWebS';
const EpRtmp = 'EpRtmp';
const LEResolver = 'letsEncrypt';

export class TraefikConfig {
  private env = useEnv();

  private webApps: AppStatus[];
  private ioApps: AppStatus[];
  private hexRanges: string[];

  private hostMain = 'dashboard.jesusstream.com';
  private hostCdn = 'cdn.jesusstream.com';
  private portHttp = 80;
  private portHttps = 443;
  private acmeEnabled = false;
  private acmeEmail = 'chris@chrisjukes.ca';
  private isWeb = false;

  constructor(clusterApps: AppStatus[]) {
    this.groupClusterApps(clusterApps);

    this.isWeb = this.env.TRAEFIK_ENDPOINTS.indexOf('web') !== -1;

    this.hostMain = this.env.TRAEFIK_DOMAIN_WEB;
    this.acmeEnabled = this.env.TRAEFIK_ACME_ENABLED;
    this.acmeEmail = this.env.TRAEFIK_ACME_EMAIL;
  }

  private groupClusterApps(clusterApps: AppStatus[]) {
    clusterApps = clusterApps.filter((app) => !!app.status);
    this.webApps = clusterApps.filter((app) => app.type === ClusterAppType.Web);
  }

  private initIpfsRanges() {
    const rangesRes = IpfsRanges.generateRanges(2, 3, this.webApps.length);
    this.hexRanges = rangesRes.data.hexsRegexs;
  }

  private getTraefikConfig() {
    let traefikConfig = {
      entryPoints: {
        [EpWeb]: {
          address: `:${this.portHttp}`,
        },
        [EpWebS]: {
          address: `:${this.portHttps}`,
        },
      },
      providers: {
        file: {
          directory: TRAEFIK_PROVIDERS_DIR,
          watch: true,
        },
      },
    };

    if (this.acmeEnabled) {
      traefikConfig = {
        ...traefikConfig,
        ...{
          certificatesResolvers: {
            [LEResolver]: {
              acme: {
                email: this.acmeEmail,
                storage: TRAEFIK_ACME_JSON,
                httpChallenge: {
                  entryPoint: EpWeb,
                },
              },
            },
          },
        },
      };
    }

    return traefikConfig;
  }

  private getTraefikWebProvider() {
    const getWebServices = () => {
      const srvWeb = () => {
        return {
          loadBalancer: {
            servers: this.webApps.map((w) => {
              return { url: `http://${w.host}:${w.portHttp}/` };
            }),
          },
        };
      };
      const srvWebSha256 = (services: { [key: string]: any }) => {
        for (let i = 0; i < this.webApps.length; i++) {
          const w = this.webApps[i];
          const srvName = `web_ipfs_${i}`;
          services[srvName] = {
            loadBalancer: {
              servers: [{ url: `http://${w.host}:${w.portHttp}/` }],
            },
          };
        }
      };
      const srvIO = () => {
        return {
          loadBalancer: {
            servers: this.ioApps.map((w) => {
              return { url: `http://${w.host}:${w.portHttp}/` };
            }),
            sticky: {
              cookie: true,
            },
          },
        };
      };

      let services = {};
      srvWebSha256(services);
      services = {
        ...services,
        ...{
          web: srvWeb(),
          io: srvIO(),
        },
      };
      return services;
    };

    const getWebRouters = () => {
      const routers = {};

      for (const index in this.webApps) {
        const routerName = `web_ipfs_${index}`;
        routers[routerName] = {
          entryPoints: EpWebS,
          rule:
            `Host(\`${this.hostMain}\`)` +
            `&& PathPrefix(\`/sha256/{id:' + ${this.hexRanges[index]} '.*}\`)`,
          service: `web_ipfs_${index}`,
        };
      }

      routers['live_data'] = {
        entryPoints: EpWebS,
        rule: `Host(\`${this.hostMain}\`)` + ` && PathPrefix(\`/live\`)`,
        service: `live_data`,
      };

      routers['io'] = {
        entryPoints: EpWebS,
        rule: `Host(\`${this.hostMain}\`)` + ` && PathPrefix(\`/socket.io\`)`,
        service: `io`,
      };

      routers['webrtc'] = {
        entryPoints: EpWebS,
        rule:
          `Host(\`${this.hostMain}\`)` + ` && PathPrefix(\`/wrtc2rtmp.io\`)`,
        service: `webrtc`,
      };

      routers['web'] = {
        entryPoints: EpWebS,
        rule: `Host(\`${this.hostMain}\`)`,
        service: `web`,
      };

      routers['plyaer'] = {
        entryPoints: EpWebS,
        rule: `Host(\`${this.hostCdn}\`) && PathPrefix(\`/player\`)`,
        service: `web`,
      };

      if (this.acmeEnabled) {
        for (const routerKey of Object.keys(routers)) {
          const router = routers[routerKey];
          routers[routerKey] = {
            ...router,
            ...{
              tls: {
                certResolver: LEResolver,
              },
            },
          };
        }
      }

      return routers;
    };

    const traefikProviderWeb = {
      http: {
        services: getWebServices(),
        routers: getWebRouters(),
      },
    };

    return traefikProviderWeb;
  }

  public async generateTraefikConfig() {
    this.initIpfsRanges();

    await fs.mkdirs(TRAEFIK_DIR);
    await fs.mkdirs(TRAEFIK_PROVIDERS_DIR);

    const traefikConfig = this.getTraefikConfig();
    await fs.writeFile(TRAEFIK_CONF, YAML.stringify(traefikConfig));
    console.log(`traefik config created: ${TRAEFIK_CONF}`);

    if (this.isWeb) {
      const providerWeb = this.getTraefikWebProvider();
      await fs.writeFile(TRAEFIK_PROVIDER_WEB, YAML.stringify(providerWeb));
      console.log(`traefik web provider created: ${TRAEFIK_PROVIDER_WEB}`);
    }
  }
}
