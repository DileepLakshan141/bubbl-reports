import { Type } from 'class-transformer';
import {
  IsString,
  IsInt,
  IsDateString,
  IsBoolean,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { TaskDto } from '../../task/dto/task-dto';
import { BlockerDto } from '../../blocker/dto/blocker.dto';
import { AchievementDto } from '../../achievement/dto/achievement.dto';

export class CreateReportDto {
  @IsInt()
  projectId!: number;

  @IsString()
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TaskDto)
  tasks!: TaskDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlockerDto)
  blockers?: BlockerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AchievementDto)
  achievements?: AchievementDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  submit?: boolean;
}
