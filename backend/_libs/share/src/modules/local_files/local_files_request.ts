export type ThumbParam = {
  type: 'width' | 'name';
  name: string | null;
};

export type LocalFilesRequestType = 'video' | 'image' | 'audio';

export class LocalFilesRequest {
  type = null as LocalFilesRequestType | null;
  format = null as string | null;
  sha256: string;
  thumb: ThumbParam;

  constructor(
    sha256: string,
    params?: {
      type?: LocalFilesRequestType | null;
      format?: string | null;
      thumb?: ThumbParam;
    },
  ) {
    this.sha256 = sha256;
    if (params) {
      if (params.type) {
        this.type = params.type;
      }
      if (params.format) {
        this.format = params.format;
      }
      if (params.thumb) {
        this.thumb = params.thumb;
      }
    }
  }

  static parseThumbSize(thumbsSize: number, width: number, minLog: number) {
    if (thumbsSize > width) {
      thumbsSize = width;
    }

    const sizeLog2 = Math.max(minLog, Math.floor(Math.log2(thumbsSize)));
    thumbsSize = Math.pow(2, sizeLog2);

    return thumbsSize.toString();
  }
}
