import * as moment from 'moment';

export class Logger {
  constructor(private name: string = '') {}

  private defPrefix() {
    return `${moment.utc().format('YYYY-MM-DD HH:mm:ss')}${
      this.name ? ` [${this.name}]` : ''
    }`;
  }

  log(...args: any) {
    console.log(this.defPrefix(), ...args);
  }
  debug(...args: any) {
    console.log(this.defPrefix(), ...args);
  }
  error(...args: any) {
    console.error(this.defPrefix(), ...args);
  }
}
