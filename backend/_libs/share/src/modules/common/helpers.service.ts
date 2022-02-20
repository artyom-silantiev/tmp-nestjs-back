import { Injectable } from '@nestjs/common';
import * as fileType from 'file-type';
import * as hasha from 'hasha';

@Injectable()
export class HelpersService {
  getRandomString(len?) {
    let str = '';
    const possible =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    len = len || 8;

    for (let i = 0; i < len; i++) {
      str += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return str;
  }

  getUid() {
    return Date.now().toString(36) + '.' + this.getRandomString();
  }

  async sleep(ms) {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  shuffle(array: Array<any>) {
    let currentIndex = array.length,
      temporaryValue,
      randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;

      // And swap it with the current element.
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  }

  async getFileInfo(file: string) {
    return fileType.fromFile(file);
  }

  /*
  durationFormat (value: number | string) {
    value = typeof value === 'string' ? parseFloat(value) : value;
    value = value * 1000;
    const days = Math.floor(value / 86400000);
    value = value % 86400000;
    const hours = Math.floor(value / 3600000);
    value = value % 3600000;
    const minutes = Math.floor(value / 60000);
    value = value % 60000;
    const seconds = Math.floor(value / 1000);
  
    function pnx (val: number) {
      if ((val + '').length == 1) {
        return '0' + val;
      } else {
        return val + '';
      }
    }
  
    const unitsFormat = (days ? days + 'd ' : '') +
      (hours ? hours + 'h ' : '') +
      (minutes ? minutes + 'm ' : '') +
      (seconds ? seconds + 's' : '') +
      (!days && !hours && !minutes && !seconds ? 0 : '');
  
    const timeFormat = (days ? days + ':' : '') +
      (hours ? pnx(hours) + ':' : '') +
      (minutes ? pnx(minutes) + ':' : '00:') +
      (seconds ? pnx(seconds) : '00') +
      (!days && !hours && !minutes && !seconds ? '00' : '');
  
    return {
      unitsFormat, timeFormat
    }
  }
  */

  async getFileSha256(filePath: string): Promise<string> {
    await this.sleep(200);
    return hasha.fromFile(filePath, { algorithm: 'sha256' });
  }
}
