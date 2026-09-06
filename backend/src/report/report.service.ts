import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReviewReportDto, ReviewAction } from './dto/review-report.dto';
import { TaskService } from '../task/task.service';
import { BlockerService } from '../blocker/blocker.service';
import { AchievementService } from '../achievement/achievement.service';
import { Prisma, Role, ReportVersionStatus } from '../generated/prisma/client';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftMetaDto } from './dto/update-draft-meta';
import { SubmitReportDto } from './dto/submit-report.dto';
import { SaveDraftDto } from './dto/save-draft.dto';

interface RequestUser {
  userId: number;
  role: Role;
}

@Injectable()
export class ReportService {
  constructor(
    private prisma: PrismaService,
    private tasksService: TaskService,
    private blockersService: BlockerService,
    private achievementsService: AchievementService,
  ) {}

  async createDraft(dto: CreateDraftDto, user: RequestUser) {
    const assignment = await this.prisma.assignedEmployee.findFirst({
      where: { projectId: dto.projectId, userId: user.userId },
    });

    if (!assignment && user.role === Role.TEAM_MEMBER) {
      throw new ForbiddenException('You are not assigned to this project');
    }

    const { start, end } = this.defaultWeekRange();

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          projectId: dto.projectId,
          name: dto.name ?? `Week of ${start.toDateString()}`,
          startDate: dto.startDate ? new Date(dto.startDate) : start,
          endDate: dto.endDate ? new Date(dto.endDate) : end,
          status: ReportVersionStatus.DRAFT,
          createdBy: user.userId,
        },
      });

      const version = await tx.reportVersion.create({
        data: {
          reportId: report.id,
          status: ReportVersionStatus.DRAFT,
          submittedAt: null,
        },
      });

      return tx.report.update({
        where: { id: report.id },
        data: { currentVersionId: version.id },
        include: this.fullInclude(),
      });
    });
  }

  async saveDraft(reportId: number, dto: SaveDraftDto, user: RequestUser) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');

    if (user.role === Role.TEAM_MEMBER && report.createdBy !== user.userId) {
      throw new ForbiddenException('You do not have access to this report');
    }
    if (!report.currentVersionId) {
      throw new BadRequestException('Report has no version to save against');
    }

    const currentVersion = await this.prisma.reportVersion.findUnique({
      where: { id: report.currentVersionId },
    });

    if (
      currentVersion?.status !== ReportVersionStatus.DRAFT &&
      currentVersion?.status !== ReportVersionStatus.NEEDS_CORRECTION
    ) {
      throw new BadRequestException(
        'Only a Draft or Needs Correction report can be saved this way',
      );
    }

    const normalizedTasks = (dto.tasks ?? []).map((t) =>
      t.isFutureTask ? { ...t, actualProgress: 0, timeSpent: 0 } : t,
    );

    return this.prisma.$transaction(async (tx) => {
      await this.tasksService.replaceMany(
        tx,
        currentVersion.id,
        normalizedTasks,
      );
      await this.blockersService.replaceMany(
        tx,
        currentVersion.id,
        dto.blockers ?? [],
      );
      await this.achievementsService.replaceMany(
        tx,
        currentVersion.id,
        dto.achievements ?? [],
      );

      await tx.optionalNote.deleteMany({
        where: { reportVersionId: currentVersion.id },
      });
      if (dto.notes) {
        await tx.optionalNote.create({
          data: { reportVersionId: currentVersion.id, content: dto.notes },
        });
      }

      return tx.report.update({
        where: { id: reportId },
        data: {
          name: dto.name ?? undefined,
          startDate: dto.startDate ? new Date(dto.startDate) : undefined,
          endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        },
        include: this.fullInclude(),
      });
    });
  }

  async submit(reportId: number, dto: SubmitReportDto, user: RequestUser) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');

    if (user.role === Role.TEAM_MEMBER && report.createdBy !== user.userId) {
      throw new ForbiddenException('You do not have access to this report');
    }
    if (!report.currentVersionId) {
      throw new BadRequestException('Report has no draft version to submit');
    }

    const currentVersion = await this.prisma.reportVersion.findUnique({
      where: { id: report.currentVersionId },
    });

    if (
      currentVersion?.status !== ReportVersionStatus.DRAFT &&
      currentVersion?.status !== ReportVersionStatus.NEEDS_CORRECTION
    ) {
      throw new BadRequestException(
        'Only a Draft or a report marked Needs Correction can be submitted',
      );
    }

    const normalizedTasks = dto.tasks.map((t) =>
      t.isFutureTask ? { ...t, actualProgress: 0, timeSpent: 0 } : t,
    );

    return this.prisma.$transaction(async (tx) => {
      const targetVersionId =
        currentVersion.status === ReportVersionStatus.DRAFT
          ? currentVersion.id
          : (
              await tx.reportVersion.create({
                data: {
                  reportId,
                  status: ReportVersionStatus.SUBMITTED,
                  submittedAt: new Date(),
                },
              })
            ).id;

      await this.tasksService.createMany(tx, targetVersionId, normalizedTasks);
      await this.blockersService.createMany(
        tx,
        targetVersionId,
        dto.blockers ?? [],
      );
      await this.achievementsService.createMany(
        tx,
        targetVersionId,
        dto.achievements ?? [],
      );
      if (dto.notes) {
        await tx.optionalNote.create({
          data: { reportVersionId: targetVersionId, content: dto.notes },
        });
      }

      if (currentVersion.status === ReportVersionStatus.DRAFT) {
        await tx.reportVersion.update({
          where: { id: targetVersionId },
          data: {
            status: ReportVersionStatus.SUBMITTED,
            submittedAt: new Date(),
          },
        });
      }

      return tx.report.update({
        where: { id: reportId },
        data: {
          status: ReportVersionStatus.SUBMITTED,
          currentVersionId: targetVersionId,
        },
        include: this.fullInclude(),
      });
    });
  }

  private defaultWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setDate(now.getDate() + diffToMonday);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  }

  async updateDraftMeta(
    reportId: number,
    dto: UpdateDraftMetaDto,
    user: RequestUser,
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');

    if (user.role === Role.TEAM_MEMBER && report.createdBy !== user.userId) {
      throw new ForbiddenException('You do not have access to this report');
    }
    if (report.status !== ReportVersionStatus.DRAFT) {
      throw new BadRequestException(
        'Only a Draft report can be edited this way',
      );
    }

    return this.prisma.report.update({
      where: { id: reportId },
      data: {
        name: dto.name,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  findAll(user: RequestUser, projectId?: number) {
    const where: Prisma.ReportWhereInput =
      user.role === Role.TEAM_MEMBER ? { createdBy: user.userId } : {};
    if (projectId) where.projectId = projectId;

    return this.prisma.report.findMany({
      where,
      include: {
        currentVersion: true,
        project: { select: { id: true, name: true } },
        creator: { select: { id: true, username: true } }, // needed for "filed by" display
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(id: number, user: RequestUser) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: this.fullInclude(),
    });
    if (!report) throw new NotFoundException('Report not found');

    if (user.role === Role.TEAM_MEMBER && report.createdBy !== user.userId) {
      throw new ForbiddenException('You do not have access to this report');
    }
    return report;
  }

  async review(reportId: number, dto: ReviewReportDto, user: RequestUser) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });
    if (!report) throw new NotFoundException('Report not found');
    if (!report.currentVersionId) {
      throw new BadRequestException('Report has no submitted version yet');
    }

    const currentVersion = await this.prisma.reportVersion.findUnique({
      where: { id: report.currentVersionId },
    });
    if (currentVersion?.status !== ReportVersionStatus.SUBMITTED) {
      throw new BadRequestException('Only a submitted report can be reviewed');
    }

    const newStatus =
      dto.action === ReviewAction.APPROVE
        ? ReportVersionStatus.APPROVED
        : ReportVersionStatus.NEEDS_CORRECTION;

    return this.prisma.$transaction(async (tx) => {
      await tx.comment.create({
        data: {
          reportVersionId: report.currentVersionId!,
          reviewerId: user.userId,
          action: dto.action,
          comment: dto.comment ?? 'Approved',
        },
      });
      await tx.reportVersion.update({
        where: { id: report.currentVersionId! },
        data: { status: newStatus },
      });
      return tx.report.update({
        where: { id: reportId },
        data: { status: newStatus },
        include: this.fullInclude(),
      });
    });
  }

  private fullInclude() {
    return {
      project: { select: { id: true, name: true } },
      versions: {
        orderBy: { createdAt: 'asc' as const },
        include: {
          tasks: true,
          blockers: true,
          achievements: true,
          notes: true,
          comments: true,
        },
      },
      currentVersion: {
        include: {
          tasks: true,
          blockers: true,
          achievements: true,
          notes: true,
          comments: true,
        },
      },
    };
  }
}
