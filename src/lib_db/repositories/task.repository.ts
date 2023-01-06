import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Task, TaskType, Prisma } from '@prisma/client';

export type TaskRow = Task;

@Injectable()
export class TaskRepository {
  constructor(private prisma: PrismaService) {}

  get R() {
    return this.prisma.task;
  }

  async taskCreate<T>(taskType: TaskType, taskData: T) {
    const newTask = await this.prisma.task.create({
      data: {
        type: taskType,
        data: taskData as Prisma.InputJsonValue,
      },
    });
    return newTask;
  }

  async getNextTasks<T>(taskTypes: TaskType[], maxAttempts = 3, count = 1) {
    const tasks = (await this.prisma.task.findMany({
      where: {
        type: {
          in: taskTypes,
        },
        isActive: false,
        isFail: false,
        attempts: {
          lt: maxAttempts,
        },
      },
      orderBy: {
        id: 'asc',
      },
      take: count,
    })) as (Task & {
      data: T;
    })[];

    return tasks;
  }

  async handleWrapPack<T>(
    types: TaskType[],
    maxAttempts: number,
    handle: (ctx: { task: Task & { data: T } }) => Promise<void>,
    count = 1,
  ) {
    const tasks = await this.getNextTasks<T>(types, maxAttempts, count);

    for (const task of tasks) {
      const ctx = { task };

      try {
        await this.prisma.task.update({
          where: {
            id: ctx.task.id,
          },
          data: {
            isActive: true,
          },
        });

        await handle(ctx);

        await this.prisma.task.delete({
          where: {
            id: ctx.task.id,
          },
        });
      } catch (error) {
        console.error(error);

        const errorEr = error as Error;
        let attemts = ctx.task.attempts;
        attemts += 1;

        if (attemts < maxAttempts) {
          await this.prisma.task.update({
            where: {
              id: ctx.task.id,
            },
            data: {
              isActive: false,
              attempts: attemts,
            },
          });
        } else {
          const errorText = errorEr.stack ? errorEr.stack : String(errorEr);
          await this.prisma.task.update({
            where: {
              id: ctx.task.id,
            },
            data: {
              attempts: attemts,
              errorText: errorText,
              isActive: false,
              isFail: true,
              failAt: new Date().toISOString(),
            },
          });
        }
      }
    }
  }
}
