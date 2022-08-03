import { INestApplicationContext } from '@nestjs/common';
import { IpfsInputService } from './ipfs-input.service';
import { IpfsModule } from './ipfs.module';

export async function appUseIpfs(appContext: INestApplicationContext) {
  const ipfsInput = appContext.select(IpfsModule).get(IpfsInputService);
  await ipfsInput.init();
}
