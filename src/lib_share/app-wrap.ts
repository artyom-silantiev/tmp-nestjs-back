import { INestApplication } from '@nestjs/common';

class AppWrap {
  private app = null as null | INestApplication;

  setApp(app: INestApplication) {
    this.app = app;
  }
  getApp() {
    return this.app;
  }
}

const appWrap = new AppWrap();
export function useAppWrap() {
  return appWrap;
}
