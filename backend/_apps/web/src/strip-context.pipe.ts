import { Injectable, PipeTransform } from '@nestjs/common';
import { omit } from 'lodash';
import { REQUEST_CONTEXT } from './user-context.interceptor';

@Injectable()
export class StripContextPipe implements PipeTransform {
  transform(value: any) {
    return omit(value, REQUEST_CONTEXT);
  }
}
