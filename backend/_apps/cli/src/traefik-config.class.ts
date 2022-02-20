import { ClusterAppType } from "@share/modules/cluster-app/cluster-app.types";
import { IpfsRangesService } from "@share/modules/ipfs_ranges/ipfs_ranges.service";

import * as fs from "fs-extra";
import * as path from "path";
import * as YAML from "json-to-pretty-yaml";
import { AppStatus } from "./cluster.types";
import { EnvService } from "@share/modules/env/env.service";

const PATH_TRAEFIK_DIR = path.resolve("./traefik");
const PATH_CLUSTER_TRAEFIK_CONF = path.resolve(PATH_TRAEFIK_DIR, "traefik.yml");
const PATH_TRAEFIK_PROVIDER_CONF = path.resolve(
  PATH_TRAEFIK_DIR,
  "provider.yml"
);
const PATH_TRAEFIK_ACME_JSON = path.resolve(PATH_TRAEFIK_DIR, "acme.json");

const EpWeb = "EpWeb";
const EpWebS = "EpWebS";
const EpRtmp = "EpRtmp";
const LEResolver = "letsEncrypt";

export class TraefikConfig {
  private webApps: AppStatus[];
  private ioApps: AppStatus[];
  private liveApps: AppStatus[];
  private webrtcApps: AppStatus[];
  private hexRanges: string[];

  private hostMain = "dashboard.jesusstream.com";
  private hostCdn = "cdn.jesusstream.com";
  private portHttp = 80;
  private portHttps = 443;
  private portRtmp = 1935;
  private acmeEnabled = false;
  private acmeEmail = "chris@chrisjukes.ca";

  constructor(
    private env: EnvService,
    clusterApps: AppStatus[],
    private ipfsRanges: IpfsRangesService
  ) {
    this.groupClusterApps(clusterApps);

    this.hostMain = env.TRAEFIK_HOST_MAIN;
    this.hostCdn = env.TRAEFIK_HOST_CDN;
    this.acmeEnabled = env.TRAEFIK_ACME_ENABLED;
    this.acmeEmail = env.TRAEFIK_ACME_EMAIL;
  }

  private groupClusterApps(clusterApps: AppStatus[]) {
    clusterApps = clusterApps.filter((app) => !!app.status);
    this.webApps = clusterApps.filter((app) => app.type === ClusterAppType.Web);
    this.ioApps = clusterApps.filter((app) => app.type === ClusterAppType.IO);
    this.liveApps = clusterApps.filter(
      (app) => app.type === ClusterAppType.Live
    );
    this.webrtcApps = clusterApps.filter(
      (app) => app.type === ClusterAppType.WebRtc
    );
  }

  private initIpfsRanges() {
    const rangesRes = this.ipfsRanges.generateRanges(2, 3, this.webApps.length);
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
        [EpRtmp]: {
          address: `:${this.portRtmp}`,
        },
      },
      providers: {
        file: {
          filename: PATH_TRAEFIK_PROVIDER_CONF,
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
                storage: PATH_TRAEFIK_ACME_JSON,
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

  private getTraefikProviderWeb() {
    const getServices = () => {
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
      const srvLiveData = () => {
        return {
          loadBalancer: {
            servers: this.liveApps.map((w) => {
              return { url: `http://${w.host}:${w.portHttp}/` };
            }),
          },
        };
      };
      const srvWebrtc = () => {
        return {
          loadBalancer: {
            servers: this.webrtcApps.map((w) => {
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
          webrtc: srvWebrtc(),
          live_data: srvLiveData(),
        },
      };
      return services;
    };

    const getRouters = () => {
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

      routers["live_data"] = {
        entryPoints: EpWebS,
        rule: `Host(\`${this.hostMain}\`)` + ` && PathPrefix(\`/live\`)`,
        service: `live_data`,
      };

      routers["io"] = {
        entryPoints: EpWebS,
        rule: `Host(\`${this.hostMain}\`)` + ` && PathPrefix(\`/socket.io\`)`,
        service: `io`,
      };

      routers["webrtc"] = {
        entryPoints: EpWebS,
        rule:
          `Host(\`${this.hostMain}\`)` + ` && PathPrefix(\`/wrtc2rtmp.io\`)`,
        service: `webrtc`,
      };

      routers["web"] = {
        entryPoints: EpWebS,
        rule: `Host(\`${this.hostMain}\`)`,
        service: `web`,
      };

      routers["plyaer"] = {
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

    const traefikProviderHttp = {
      // middlewares: {},
      services: getServices(),
      routers: getRouters(),
    };

    return traefikProviderHttp;
  }

  private getTraefikProviderTcp() {
    const getServices = () => {
      const srvLiveRtmp = () => {
        return {
          loadBalancer: {
            servers: this.liveApps.map((w) => {
              return { address: `${w.host}:${w.portRtmp}` };
            }),
          },
        };
      };

      const services = {
        live_rtmp: srvLiveRtmp(),
      };
      return services;
    };

    const getRouters = () => {
      const routers = {};

      routers["live_rtmp"] = {
        entryPoints: EpRtmp,
        rule: `HostSNI(\`*\`)`,
        service: `live_rtmp`,
      };

      return routers;
    };

    const traefikProviderTcp = {
      services: getServices(),
      routers: getRouters(),
    };

    return traefikProviderTcp;
  }

  private getTraefikProvider() {
    const traefikProvider = {
      http: this.getTraefikProviderWeb(),
      tcp: this.getTraefikProviderTcp(),
    };

    return traefikProvider;
  }

  public async generateTraefikConfig() {
    this.initIpfsRanges();

    const traefikConfig = this.getTraefikConfig();
    const traefikProvider = this.getTraefikProvider();

    await fs.mkdirs(PATH_TRAEFIK_DIR);
    await fs.writeFile(
      PATH_CLUSTER_TRAEFIK_CONF,
      YAML.stringify(traefikConfig)
    );
    await fs.writeFile(
      PATH_TRAEFIK_PROVIDER_CONF,
      YAML.stringify(traefikProvider)
    );

    console.log(`traefik config created: ${PATH_CLUSTER_TRAEFIK_CONF}`);
    console.log(`traefik file provider created: ${PATH_TRAEFIK_PROVIDER_CONF}`);
  }
}
