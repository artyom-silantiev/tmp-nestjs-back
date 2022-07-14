import * as moment from 'moment';

class Logger {
  constructor(private name: string) {}

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

const loggers = {} as { [name: string]: Logger };

export function useStdLogger(name?: string) {
  return new Logger(name || '');
}
