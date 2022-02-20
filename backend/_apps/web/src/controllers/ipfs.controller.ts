import {
  Controller,
  Get,
  Head,
  Param,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { IpfsOmsService } from '@share/modules/ipfs/ipfs-oms.service';
import { Response, Request } from 'express';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import IpfsRequest from '@share/modules/ipfs/ipfs_request';

export class BySha256ParamDto {
  @IsString()
  @ApiProperty({ default: '' })
  sha256Param: string;
}

export class BySha256AndArgsDto {
  @IsString()
  @ApiProperty({ default: '' })
  sha256: string;

  @IsString()
  @ApiProperty({ default: '' })
  args: string;
}

@ApiTags('sha256/ (Ipfs by sha256)')
@Controller()
export class IpfsController {
  constructor(private ipfsOms: IpfsOmsService) {}

  parseSha256Param(sha256Param: string, query: { [key: string]: string }) {
    let ipfsRequest: IpfsRequest;

    let match = sha256Param.match(/^([0-9a-f]*)(\.(\w+))$/);
    if (match) {
      const sha256 = match[1];
      ipfsRequest = new IpfsRequest(sha256);
      ipfsRequest.format = match[3];
    }

    match = sha256Param.match(/^([0-9a-f]*)(\:(\d+))?$/);
    if (!ipfsRequest && match) {
      const sha256 = match[1];

      ipfsRequest = new IpfsRequest(sha256);

      if (match[3]) {
        const temp = match[3];
        if (!Number.isNaN(temp)) {
          ipfsRequest.thumb = {
            type: 'width',
            name: temp,
          };
        }
      }
    }

    match = sha256Param.match(/^([0-9a-f]*)(\:(fullhd))?$/);
    if (!ipfsRequest && match) {
      const sha256 = match[1];
      ipfsRequest = new IpfsRequest(sha256);
      if (match[3]) {
        ipfsRequest.thumb = {
          type: 'name',
          name: match[3],
        };
      }
    }

    if (!ipfsRequest) {
      ipfsRequest = new IpfsRequest(sha256Param);
    }

    if (query.w) {
      ipfsRequest.thumb = {
        type: 'width',
        name: query.w,
      };
    } else if (query.n) {
      ipfsRequest.thumb = {
        type: 'name',
        name: query.n,
      };
    }

    return ipfsRequest;
  }

  getIpfsObjectBySha256AndArgsAndQuery(
    sha256: string,
    args: string,
    query: { [key: string]: string },
  ) {
    const ipfsRequest = new IpfsRequest(sha256);

    const match = args.match(/^(image|video)(\.(\w+))?$/);
    if (match) {
      ipfsRequest.type = match[1] as 'image' | 'video';
      if (match[3]) {
        ipfsRequest.format = match[3];
      }
    }

    if (query.w) {
      ipfsRequest.thumb = {
        type: 'width',
        name: query.w,
      };
    } else if (query.n) {
      ipfsRequest.thumb = {
        type: 'name',
        name: query.n,
      };
    }

    return ipfsRequest;
  }

  @Head('/sha256/:sha256Param')
  @ApiOperation({
    description: 'get data for ipfs object by sha256',
    summary: 'complete',
  })
  async headBySha256(
    @Param() params: BySha256ParamDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const sha256Param = req.params['sha256Param'];
    const query = req.query as { [key: string]: string };
    const ipfsRequest = this.parseSha256Param(sha256Param, query);

    const getIpfsCachItemRes = await this.ipfsOms.getIpfsCacheItemByIpfsRequest(
      ipfsRequest,
    );
    if (getIpfsCachItemRes.isBad) {
      console.error(getIpfsCachItemRes.errData);
      if (getIpfsCachItemRes.data) {
        getIpfsCachItemRes.data.processEnd();
      }
      res.status(getIpfsCachItemRes.code).send('');
      return;
    }
    const cacheItem = getIpfsCachItemRes.data;

    const ipfsCacheItemHeaders = cacheItem.getHeaders();
    res.set(ipfsCacheItemHeaders);

    cacheItem.statsEmitHead();

    res.send('');

    return;
  }

  @Get('/sha256/:sha256Param')
  @ApiOperation({
    description: 'get data for ipfs object by sha256',
    summary: 'complete',
  })
  async getBySha256(
    @Param() params: BySha256ParamDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const sha256Param = req.params['sha256Param'];
    const query = req.query as { [key: string]: string };
    const ipfsRequest = this.parseSha256Param(sha256Param, query);

    const getIpfsCachItemRes = await this.ipfsOms.getIpfsCacheItemByIpfsRequest(
      ipfsRequest,
    );
    if (getIpfsCachItemRes.isBad) {
      console.error(getIpfsCachItemRes.errData);
      if (getIpfsCachItemRes.data) {
        getIpfsCachItemRes.data.processEnd();
      }
      res.status(getIpfsCachItemRes.code);
      return '';
    }
    const cacheItem = getIpfsCachItemRes.data;

    const ipfsCacheItemHeaders = cacheItem.getHeaders();
    res.set(ipfsCacheItemHeaders);

    cacheItem.statsEmitGet();

    return new StreamableFile(cacheItem.createReadStream());
  }

  @Head('/sha256/:sha256/:args')
  @ApiOperation({
    description: 'get data for ipfs object by sha256',
    summary: 'complete',
  })
  async headBySha256AndArgs(
    @Param() params: BySha256AndArgsDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const sha256 = params['sha256'];
    const args = params['args'];
    const query = req.query as { [key: string]: string };
    const ipfsRequest = this.getIpfsObjectBySha256AndArgsAndQuery(
      sha256,
      args,
      query,
    );

    const getIpfsCachItemRes = await this.ipfsOms.getIpfsCacheItemByIpfsRequest(
      ipfsRequest,
    );
    if (getIpfsCachItemRes.isBad) {
      console.error(getIpfsCachItemRes.errData);
      if (getIpfsCachItemRes.data) {
        getIpfsCachItemRes.data.processEnd();
      }
      res.status(getIpfsCachItemRes.code);
      return '';
    }
    const cacheItem = getIpfsCachItemRes.data;

    const ipfsCacheItemHeaders = cacheItem.getHeaders();
    res.set(ipfsCacheItemHeaders);

    cacheItem.statsEmitHead();

    return new StreamableFile(cacheItem.createReadStream());
  }

  @Get('/sha256/:sha256/:args')
  @ApiOperation({
    description: 'get data for ipfs object by sha256',
    summary: 'complete',
  })
  async getBySha256AndArgs(
    @Param() params: BySha256AndArgsDto,
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request,
  ) {
    const sha256 = params['sha256'];
    const args = params['args'];
    const query = req.query as { [key: string]: string };
    const ipfsRequest = this.getIpfsObjectBySha256AndArgsAndQuery(
      sha256,
      args,
      query,
    );

    const getIpfsCachItemRes = await this.ipfsOms.getIpfsCacheItemByIpfsRequest(
      ipfsRequest,
    );
    if (getIpfsCachItemRes.isBad) {
      console.error(getIpfsCachItemRes.errData);
      if (getIpfsCachItemRes.data) {
        getIpfsCachItemRes.data.processEnd();
      }
      res.status(getIpfsCachItemRes.code);
      return '';
    }
    const cacheItem = getIpfsCachItemRes.data;

    const ipfsCacheItemHeaders = cacheItem.getHeaders();
    res.set(ipfsCacheItemHeaders);

    cacheItem.statsEmitGet();

    return new StreamableFile(cacheItem.createReadStream());
  }
}
