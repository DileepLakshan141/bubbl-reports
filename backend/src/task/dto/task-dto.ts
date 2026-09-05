import {
  IsString,
  IsInt,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { TaskType } from '../../generated/prisma/client';

export class TaskDto {
  @IsString()
  name!: string;

  @IsString()
  priority!: string;

  @IsEnum(TaskType)
  type!: TaskType;

  @IsString()
  status!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  plannedProgress!: number;

  @IsInt()
  @Min(0)
  @Max(100)
  actualProgress!: number;

  @IsNumber()
  @Min(0)
  timePlanned!: number;

  @IsNumber()
  @Min(0)
  timeSpent!: number;

  @IsOptional()
  @IsString()
  output?: string;

  @IsBoolean()
  isFutureTask!: boolean;
}
