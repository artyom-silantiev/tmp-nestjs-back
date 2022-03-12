import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';

@Injectable()
export class FFmpegService {
  async probe(file: string) {
    return <ffmpeg.FfprobeData>await new Promise((resolve, reject) => {
      ffmpeg.ffprobe(file, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async getMediaContentProbe(file: string) {
    const probeFile = await this.probe(file);

    const result = {
      format: probeFile.format,
      chapters: probeFile.chapters,
    } as {
      format: ffmpeg.FfprobeFormat;
      videoStreams?: ffmpeg.FfprobeStream[];
      audioStreams?: ffmpeg.FfprobeStream[];
      chapters: any[];
    };

    const videoStreams = probeFile.streams.filter(
      (v) => v.codec_type === 'video',
    );
    const audioStreams = probeFile.streams.filter(
      (v) => v.codec_type === 'audio',
    );
    result.videoStreams = videoStreams;

    return result;
  }
}
