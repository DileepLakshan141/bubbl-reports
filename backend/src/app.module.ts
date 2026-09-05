import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { ProjectModule } from './project/project.module';
import { TaskModule } from './task/task.module';
import { BlockerModule } from './blocker/blocker.module';
import { AchievementModule } from './achievement/achievement.module';
import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    ProjectModule,
    TaskModule,
    BlockerModule,
    AchievementModule,
    ReportModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
