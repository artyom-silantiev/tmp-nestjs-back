import { AppInfo } from "@share/modules/cluster-app/cluster-app.service";

export type AppStatus = AppInfo & {
  status: boolean;
};
