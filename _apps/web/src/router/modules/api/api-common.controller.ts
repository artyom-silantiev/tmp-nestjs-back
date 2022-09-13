import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { useEnv } from '@share/composables/env/env';

@ApiTags('api/')
@Controller('/api')
export class ApiCommonController {
  private env = useEnv();

  @Get('/configs')
  @ApiOperation({
    summary: '/configs',
  })
  getConfigs() {
    return {
      maxUploadImageSize: {
        value: this.env.IPFS_IMAGE_MAX_SIZE,
        description:
          'Max upload image size in bytes for: user image, stream image, record image, record screenshot, category image.',
      },
    };
  }
}
