export class StandardResult<T> {
  public code: number;
  public data: null | T = null;
  public errData: any;

  constructor(code = 200) {
    this.code = code;
  }

  public setErrData(errData: any, code = null as null | number) {
    if (code) {
      this.code = code;
    }
    this.errData = errData;
    return this;
  }

  public setCode(code: number) {
    this.code = code;
    return this;
  }

  public setData(data: T) {
    this.data = data;
    return this;
  }

  get isGood() {
    return this.code >= 200 && this.code <= 299;
  }

  get isBad() {
    return this.code >= 400;
  }

  public mergeBad<X>(res: StandardResult<X>) {
    this.code = res.code;
    this.errData = res.errData;
    return this;
  }

  public mergeGood(res: StandardResult<T>) {
    this.code = res.code;
    this.errData = res.errData;
    this.data = res.data;
    return this;
  }
}
