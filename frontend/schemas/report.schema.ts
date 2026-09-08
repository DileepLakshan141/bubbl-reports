import { z } from "zod";

const numericField = (min = 0, max?: number) => {
  let innerSchema = z.number().min(min);

  if (max !== undefined) {
    innerSchema = innerSchema.max(max);
  }

  return z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return 0;
    const parsed = Number(val);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, innerSchema);
};

const stringOrNullField = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((val) => val ?? "");

export const taskSchema = z.object({
  name: z.string().min(1, "Task name is required"),
  priority: z.string().default("Medium"),
  type: z.string().default("Development"),
  status: z.string().default("Not Started"),
  plannedProgress: numericField(0, 100),
  actualProgress: numericField(0, 100),
  timePlanned: numericField(0),
  timeSpent: numericField(0),
  output: stringOrNullField,
  isFutureTask: z.boolean().default(false),
});

export const blockerSchema = z.object({
  name: z.string().min(1, "Blocker description is required"),
  isKeyIssue: z.boolean().default(false),
});

export const achievementSchema = z.object({
  name: z.string().min(1, "Achievement description is required"),
  isKeyAchievement: z.boolean().default(false),
});

export const reportEditorSchema = z.object({
  name: z.string().min(1, "Report name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  tasks: z.array(taskSchema),
  futureTasks: z.array(
    z.object({
      name: z.string().min(1, "Future task name is required"),
      priority: z.string().default("Medium"),
      type: z.string().default("Development"),
      status: z.string().default("Not Started"),
      plannedProgress: numericField(0, 100),
      actualProgress: numericField(0, 100).default(0),
      timePlanned: numericField(0),
      timeSpent: numericField(0).default(0),
      output: stringOrNullField,
      isFutureTask: z.boolean().default(true),
    }),
  ),
  blockers: z.array(blockerSchema),
  achievements: z.array(achievementSchema),
  notes: stringOrNullField,
});

export type ReportEditorValues = z.infer<typeof reportEditorSchema>;
