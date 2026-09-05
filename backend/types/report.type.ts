import { TaskType } from '../src/generated/prisma/client';

export type TaskInput = {
  name: string;
  priority: string;
  type: TaskType;
  status: string;
  plannedProgress: number;
  actualProgress: number;
  timePlanned: number;
  timeSpent: number;
  output?: string;
  isFutureTask: boolean;
};
