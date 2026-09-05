import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

type BlockerInput = { name: string; isKeyIssue: boolean };

@Injectable()
export class BlockerService {
  createMany(
    tx: Prisma.TransactionClient,
    reportVersionId: number,
    blockers: BlockerInput[],
  ) {
    if (!blockers.length) return Promise.resolve();
    return tx.blocker.createMany({
      data: blockers.map((b) => ({ ...b, reportVersionId })),
    });
  }

  findByVersion(tx: Prisma.TransactionClient, reportVersionId: number) {
    return tx.blocker.findMany({ where: { reportVersionId } });
  }
}
