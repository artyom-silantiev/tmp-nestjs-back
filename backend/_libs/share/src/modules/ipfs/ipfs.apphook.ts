import { INestApplicationContext } from '@nestjs/common';
import { IpfsIndexService, IpfsInitOptions } from './ipfs-index.service';
import { IpfsModule } from './ipfs.module';

export async function useIpfs(
  appContext: INestApplicationContext,
  options?: IpfsInitOptions,
) {
  const ipfsIndex = appContext.select(IpfsModule).get(IpfsIndexService);
  await ipfsIndex.init(options);
}
