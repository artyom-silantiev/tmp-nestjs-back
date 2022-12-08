import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from '@db/prisma.service';
import {
  RequestContext,
  REQUEST_CONTEXT,
} from '@share/apphooks/validator/user-context.interceptor';
import { useAppWrap } from '@share/app-wrap';

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
export class EmailIsUniqueRule implements ValidatorConstraintInterface {
  private isInit = false;
  private prisma: PrismaService;

  async init() {
    this.prisma = useAppWrap().getApp().get(PrismaService);
    this.isInit = true;
  }

  async validate(value: string, args: ValidationArguments) {
    if (!this.isInit) {
      await this.init();
    }

    const options = args.constraints[0] as EmailIsUniquewOptions;
    const reqContext = args.object[REQUEST_CONTEXT] as RequestContext;

    const user = await this.prisma.user.findUnique({
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
