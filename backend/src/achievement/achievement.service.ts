import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

type AchievementInput = { name: string; isKeyAchievement: boolean };

@Injectable()
export class AchievementService {
  createMany(
    tx: Prisma.TransactionClient,
    reportVersionId: number,
    achievements: AchievementInput[],
  ) {
    if (!achievements.length) return Promise.resolve();
    return tx.achievement.createMany({
      data: achievements.map((a) => ({ ...a, reportVersionId })),
    });
  }

  async replaceMany(
    tx: Prisma.TransactionClient,
    reportVersionId: number,
    achievements: AchievementInput[],
  ) {
    await tx.achievement.deleteMany({ where: { reportVersionId } });
    if (achievements.length) {
      await tx.achievement.createMany({
        data: achievements.map((a) => ({ ...a, reportVersionId })),
      });
    }
  }

  findByVersion(tx: Prisma.TransactionClient, reportVersionId: number) {
    return tx.achievement.findMany({ where: { reportVersionId } });
  }
}
