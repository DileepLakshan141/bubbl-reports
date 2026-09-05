import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportController } from './report.controller';
import { TaskService } from '../task/task.service';
import { BlockerService } from '../blocker/blocker.service';
import { AchievementService } from '../achievement/achievement.service';

@Module({
  controllers: [ReportController],
  providers: [ReportService, TaskService, BlockerService, AchievementService],
})
export class ReportModule {}
