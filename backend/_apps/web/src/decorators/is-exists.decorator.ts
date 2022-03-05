import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@db/prisma.service';
import {
  RequestContext,
  REQUEST_CONTEXT,
} from '@share/apphooks/validator/user-context.interceptor';

export type ExistsOptions = {
  type: 'user';
  userFilter?: boolean;
};

export function IsExists(
  options: ExistsOptions,
  validationOptions?: ValidationOptions,
) {
  if (typeof options.userFilter === 'undefined') {
    options.userFilter = false;
  }

  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [options],
      validator: IsExistsRule,
    });
  };
}

@ValidatorConstraint({ name: 'IsExists', async: true })
@Injectable()
export class IsExistsRule implements ValidatorConstraintInterface {
  constructor(private prismaService: PrismaService) {}

  async validate(value: string, args: ValidationArguments) {
    const id = BigInt(value);
    const options = args.constraints[0] as ExistsOptions;
    const reqContext = args.object[REQUEST_CONTEXT] as RequestContext;

    let row: any;
    let filter = {};
    if (options.userFilter) {
      const userId = BigInt(reqContext.user.userId);
      filter = { userId };
    }

    if (options.type === 'user') {
      row = await this.prismaService.user.findFirst({
        where: {
          id,
        },
      });
    }

    if (!row) {
      return false;
    }

    return true;
  }

  defaultMessage() {
    return 'row not exist or not own this user';
  }
}
