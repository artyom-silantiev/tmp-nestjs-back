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

type EmailIsUniquewOptions = null | {
  selfCheck: boolean;
};

export function EmailIsUnique(
  options = null as EmailIsUniquewOptions,
  validationOptions?: ValidationOptions,
) {
  return (object: any, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [options],
      validator: EmailIsUniqueRule,
    });
  };
}

@ValidatorConstraint({ name: 'EmailIsUnique', async: true })
@Injectable()
export class EmailIsUniqueRule implements ValidatorConstraintInterface {
  constructor(private prismaService: PrismaService) {}

  async validate(value: string, args: ValidationArguments) {
    const options = args.constraints[0] as EmailIsUniquewOptions;
    const reqContext = args.object[REQUEST_CONTEXT] as RequestContext;

    const user = await this.prismaService.user.findUnique({
      where: {
        email: value,
      },
    });

    if (user) {
      if (options && options.selfCheck && reqContext && reqContext.user) {
        const selfUser = reqContext.user;
        if (selfUser.userId === user.id.toString()) {
          return true;
        }
      }

      return false;
    }

    return true;
  }

  defaultMessage() {
    return 'email is not unique';
  }
}
