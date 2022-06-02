import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { User, Prisma, UserRole, Jwt, Setting } from '@prisma/client';
import * as lodash from 'lodash';
import { Enumerable } from '@share/support.types';
import { ImageRow } from './image.service';
import { useBcrypt } from '@share/bcrypt';
import { useBs58 } from '@share/bs58';

export type UserRow = User & {
  Image?: ImageRow;
  Jwt?: Jwt[];
  Settings?: Setting[];
};

export interface UserGeo {
  ip: string;
  country: string;
  city: string;
  continent: string;
  latitude: number;
  longitude: number;
}

export enum UserViewType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export class UserView {
  // public data
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageSha256: string;

  // private data
  phone?: string;
  role?: UserRole;

  static getByModel(model: UserRow, viewType = UserViewType.PUBLIC) {
    const modelView = Object.assign(new UserView(), {
      id: model.id.toString(),
      email: model.email,

      imageSha256: UserView.getImageSha256(model),
    }) as UserView;

    if (viewType === UserViewType.PRIVATE) {
      modelView.phone = model.phone;
      modelView.role = model.role;
    }

    return modelView;
  }

  static getImageSha256(model: UserRow) {
    if (model.Image && model.Image.IpfsObject) {
      return model.Image.IpfsObject.sha256;
    }
    return null;
  }
}

export class UserFetchBuilder {
  args: Prisma.UserFindManyArgs = {};

  constructor(private prisma: PrismaService) {}

  init(initialArgs: Prisma.UserFindManyArgs) {
    this.args = initialArgs;
  }

  orderBy(orderByParams: Enumerable<Prisma.UserOrderByWithRelationInput>) {
    this.args = lodash.merge(this.args, {
      orderBy: orderByParams,
    });
    return this;
  }

  where(whereParams: Prisma.UserWhereInput) {
    this.args = lodash.merge(this.args, {
      where: whereParams,
    });
    return this;
  }

  async fetch() {
    const countArgs = {
      where: this.args.where || {},
    };
    const rows = await this.prisma.user.findMany(this.args);
    const rowsTotal = await this.prisma.user.count(countArgs);

    return { rows, rowsTotal };
  }
}

@Injectable()
export class UserService {
  private bcrypt = useBcrypt();
  private bs58 = useBs58();

  constructor(private prisma: PrismaService) {}

  toView(model: UserRow, type: UserViewType = UserViewType.PUBLIC): UserView {
    return UserView.getByModel(model, type);
  }

  createFetchBuilder() {
    return new UserFetchBuilder(this.prisma);
  }

  includeImage() {
    return {
      Image: {
        include: {
          IpfsObject: true,
        },
      },
    };
  }

  whereNotDeleted() {
    return {
      deletedAt: null,
    }; // as Prisma.UserWhereInput;
  }

  async generatePassword(password?: string) {
    password = password || this.bs58.getRandomBs58String(12);
    const passwordHash = await this.bcrypt.generatePasswordHash(password);

    return { password, passwordHash };
  }

  async createUser(params: {
    email: string;
    password?: string;
    phone: string;
    firstName: string;
    lastName: string;

    role?: UserRole;
    emailActivatedAt?: Date;
  }) {
    const passData = await this.generatePassword(params.password);

    const userCreateData = {
      email: params.email,
      passwordHash: passData.passwordHash,
      phone: params.phone,
      firstName: params.firstName,
      lastName: params.lastName,
    } as Prisma.UserCreateInput;

    if (params.role) {
      userCreateData.role = params.role;
    }
    if (params.emailActivatedAt) {
      userCreateData.emailActivatedAt = params.emailActivatedAt;
    }

    const user = await this.prisma.user.create({
      data: userCreateData,
    });

    return {
      password: passData.password,
      user,
    };
  }

  async findFirst(userWhereInput: Prisma.UserWhereInput) {
    return this.prisma.user.findFirst({
      where: userWhereInput,
      include: {
        ...this.includeImage(),
      },
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.user.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        ...this.includeImage(),
      },
    });
  }

  async update(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    const { where, data } = params;
    return this.prisma.user.update({
      data,
      where,
      include: {
        ...this.includeImage(),
      },
    });
  }

  async updateByModel(
    user: UserRow,
    data: Prisma.UserUncheckedUpdateInput,
  ): Promise<User> {
    return this.update({
      where: {
        id: user.id,
      },
      data,
    });
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    return this.prisma.user.delete({
      where,
    });
  }

  async changePassword(userId: bigint, password: string) {
    const passwordHash = await this.bcrypt.generatePasswordHash(password);

    await this.update({
      where: {
        id: userId,
      },
      data: {
        passwordHash,
      },
    });
  }
}
