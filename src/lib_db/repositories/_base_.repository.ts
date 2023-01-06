import { Prisma } from '.prisma/client';
import { Enumerable } from '@share/support.types';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as lodash from 'lodash';

type Base = {
  id: bigint;
};
type BaseRelation = {
  id: bigint;
  baseId: bigint;
  Base?: Base;
};
type BaseRelationView = {
  id: string;
  baseId: string;
};

export type BaseRow = Base & {
  BaseRelation?: BaseRelation;
};

export class BaseView {
  id: string;

  // relation
  BaseRelation?: BaseRelationView;

  static getByModel(model: BaseRow) {
    const modelView = Object.assign(new BaseView(), {
      id: model.id.toString(),
    }) as BaseView;

    if (model.BaseRelation) {
      modelView.BaseRelation = {
        id: model.BaseRelation.id.toString(),
        baseId: model.BaseRelation.baseId.toString(),
      };
    }

    return modelView;
  }
}

/*
export class BaseFetchBuilder {
  args: Prisma.BaseFindManyArgs = {};

  constructor(private prisma: PrismaService) {}

  init(initialArgs: Prisma.BaseFindManyArgs) {
    this.args = initialArgs;
  }

  orderBy(orderByParams: Enumerable<Prisma.BaseOrderByWithRelationInput>) {
    this.args = lodash.merge(this.args, {
      orderBy: orderByParams,
    });
    return this;
  }

  where(whereParams: Prisma.BaseWhereInput) {
    this.args = lodash.merge(this.args, {
      where: whereParams,
    });
    return this;
  }

  async fetch() {
    const countArgs = {
      where: this.args.where || {},
    };
    const rows = await this.prisma.base.findMany(this.args);
    const rowsTotal = await this.prisma.base.count(countArgs);

    return { rows, rowsTotal };
  }
}
*/

@Injectable()
export class BaseRepository {
  constructor(private prisma: PrismaService) {}

  /*
  get R() {
    return this.prisma.base;
  }
  */

  toView(model: BaseRow) {
    return BaseView.getByModel(model);
  }

  /*
  createFetchBuilder() {
    return new BaseFetchBuilder(this.prisma);
  }
  */
}
