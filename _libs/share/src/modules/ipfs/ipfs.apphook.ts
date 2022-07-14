import { INestApplicationContext } from '@nestjs/common';
import { IpfsInputService, IpfsInitOptions } from './ipfs-input.service';
import { IpfsModule } from './ipfs.module';

export async function useIpfs(
  appContext: INestApplicationContext,
  options?: IpfsInitOptions,
) {
  const ipfsInput = appContext.select(IpfsModule).get(IpfsInputService);
  await ipfsInput.init(options);
}
