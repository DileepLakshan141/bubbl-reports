import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import { TaskInput } from '../../types/report.type';

@Injectable()
export class TaskService {
  createMany(
    tx: Prisma.TransactionClient,
    reportVersionId: number,
    tasks: TaskInput[],
  ) {
    if (!tasks.length) return Promise.resolve();
    return tx.task.createMany({
      data: tasks.map((t) => ({ ...t, reportVersionId })),
    });
  }

  findByVersion(tx: Prisma.TransactionClient, reportVersionId: number) {
    return tx.task.findMany({ where: { reportVersionId } });
  }
}
