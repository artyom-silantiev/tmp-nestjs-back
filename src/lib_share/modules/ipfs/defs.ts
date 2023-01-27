import { useEnv } from "@share/lib/env/env";

export const IpfsDefs = {
  DIR_IPFS_CACHE: `${useEnv().DIR_DATA}/ipfs_cache`
};
