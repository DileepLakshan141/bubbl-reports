import { Type } from 'class-transformer';
import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { TaskDto } from '../../task/dto/task-dto';
import { BlockerDto } from '../../blocker/dto/blocker.dto';
import { AchievementDto } from '../../achievement/dto/achievement.dto';

export class SubmitReportDto {
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
}
