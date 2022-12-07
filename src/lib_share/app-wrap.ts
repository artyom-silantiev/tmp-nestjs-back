import { INestApplication, INestApplicationContext } from '@nestjs/common';

class AppWrap {
  private app = null as null | INestApplication;
  private appContext = null as null | INestApplicationContext;

  setApp(app: INestApplication) {
    this.app = app;
  }
  getApp() {
    return this.app;
  }

  setAppContext(appContext: INestApplicationContext) {
    this.appContext = appContext;
  }
  getAppContext() {
    return this.appContext;
  }
}

const appWrap = new AppWrap();
export function useAppWrap() {
  return appWrap;
}
