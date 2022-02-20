import { EnvService } from '@share/modules/env/env.service';
import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('api/')
@Controller('/api')
export class ApiCommonController {
  constructor(private env: EnvService) {}

  @Get('/configs')
  @ApiOperation({
    description: 'get system configs for frontend',
    summary: 'complete',
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
