import {
  Controller,
  Get,
  Head,
  Param,
  Req,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiOperation, ApiProperty, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import IpfsRequest from '@share/modules/ipfs/ipfs_request';
import {
  LocalFileMeta,
  LocalFilesOutputService,
} from '@share/modules/local_files/local_files-output.service';
import * as fs from 'fs-extra';
import { LocalFilesRequest } from '@share/modules/local_files/local_files_request';

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

@ApiTags('/local_files/sha256/ (Local files by sha256)')
@Controller('/local_files')
export class LocalFilesController {
  constructor(private localFilesOutput: LocalFilesOutputService) {}

  parseSha256Param(sha256Param: string, query: { [key: string]: string }) {
    let localFilesRequest: LocalFilesRequest;

    let match = sha256Param.match(/^([0-9a-f]*)(\.(\w+))$/);
    if (match) {
      const sha256 = match[1];
      localFilesRequest = new LocalFilesRequest(sha256);
      localFilesRequest.format = match[3];
    }

    match = sha256Param.match(/^([0-9a-f]*)(\:(\d+))?$/);
    if (!localFilesRequest && match) {
      const sha256 = match[1];

      localFilesRequest = new LocalFilesRequest(sha256);

      if (match[3]) {
        const temp = match[3];
        if (!Number.isNaN(temp)) {
          localFilesRequest.thumb = {
            type: 'width',
            name: temp,
          };
        }
      }
    }

    match = sha256Param.match(/^([0-9a-f]*)(\:(fullhd))?$/);
    if (!localFilesRequest && match) {
      const sha256 = match[1];
      localFilesRequest = new LocalFilesRequest(sha256);
      if (match[3]) {
        localFilesRequest.thumb = {
          type: 'name',
          name: match[3],
        };
      }
    }

    if (!localFilesRequest) {
      localFilesRequest = new LocalFilesRequest(sha256Param);
    }

    if (query.w) {
      localFilesRequest.thumb = {
        type: 'width',
        name: query.w,
      };
    } else if (query.n) {
      localFilesRequest.thumb = {
        type: 'name',
        name: query.n,
      };
    }

    return localFilesRequest;
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

  getHeadersForLocalFile(localFile: LocalFileMeta) {
    return {
      'Cache-Control': 'public, immutable',
      'Content-Type': localFile.mime,
      'Content-Length': localFile.size,
      'Last-Modified': new Date(localFile.createdAt).toUTCString(),
      ETag: localFile.sha256,
    };
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
    const localFilesRequest = this.parseSha256Param(sha256Param, query);

    const getLocalFileRes =
      await this.localFilesOutput.getLocalFilePathByLocalFilesRequest(
        localFilesRequest,
      );
    if (getLocalFileRes.isBad) {
      console.error(getLocalFileRes.errData);
      res.status(getLocalFileRes.code).send('');
      return;
    }
    const localFile = getLocalFileRes.data;

    const ipfsCacheItemHeaders = this.getHeadersForLocalFile(localFile);
    res.set(ipfsCacheItemHeaders);

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
    const localFilesRequest = this.parseSha256Param(sha256Param, query);

    const getLocalFileRes =
      await this.localFilesOutput.getLocalFilePathByLocalFilesRequest(
        localFilesRequest,
      );
    if (getLocalFileRes.isBad) {
      console.error(getLocalFileRes.errData);
      res.status(getLocalFileRes.code).send('');
      return;
    }
    const localFile = getLocalFileRes.data;

    const ipfsCacheItemHeaders = this.getHeadersForLocalFile(localFile);
    res.set(ipfsCacheItemHeaders);

    return new StreamableFile(fs.createReadStream(localFile.absPathToFile));
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
    const localFilesRequest = this.getIpfsObjectBySha256AndArgsAndQuery(
      sha256,
      args,
      query,
    );

    const getLocalFileRes =
      await this.localFilesOutput.getLocalFilePathByLocalFilesRequest(
        localFilesRequest,
      );
    if (getLocalFileRes.isBad) {
      console.error(getLocalFileRes.errData);
      res.status(getLocalFileRes.code).send('');
      return;
    }
    const localFile = getLocalFileRes.data;

    const ipfsCacheItemHeaders = this.getHeadersForLocalFile(localFile);
    res.set(ipfsCacheItemHeaders);

    res.send('');

    return;
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
    const localFilesRequest = this.getIpfsObjectBySha256AndArgsAndQuery(
      sha256,
      args,
      query,
    );

    const getLocalFileRes =
      await this.localFilesOutput.getLocalFilePathByLocalFilesRequest(
        localFilesRequest,
      );
    if (getLocalFileRes.isBad) {
      console.error(getLocalFileRes.errData);
      res.status(getLocalFileRes.code).send('');
      return;
    }
    const localFile = getLocalFileRes.data;

    const ipfsCacheItemHeaders = this.getHeadersForLocalFile(localFile);
    res.set(ipfsCacheItemHeaders);

    return new StreamableFile(fs.createReadStream(localFile.absPathToFile));
  }
}
