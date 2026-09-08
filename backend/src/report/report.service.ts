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
import { FindReportsQueryDto } from './dto/find-reports-query.dto';

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
    const targetStartDate = dto.startDate ? new Date(dto.startDate) : start;
    const targetEndDate = dto.endDate ? new Date(dto.endDate) : end;
    const existingReport = await this.prisma.report.findFirst({
      where: {
        projectId: dto.projectId,
        createdBy: user.userId,
        startDate: {
          gte: targetStartDate,
          lte: targetEndDate,
        },
      },
    });

    if (existingReport) {
      throw new BadRequestException('A report already exists for this week');
    }

    return this.prisma.$transaction(
      async (tx) => {
        const report = await tx.report.create({
          data: {
            projectId: dto.projectId,
            name: dto.name ?? `Week of ${start.toDateString()}`,
            startDate: targetStartDate,
            endDate: targetEndDate,
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
      },
      { timeout: 15000 },
    );
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

    return this.prisma.$transaction(
      async (tx) => {
        const targetVersionId =
          currentVersion.status === ReportVersionStatus.DRAFT
            ? currentVersion.id
            : (
                await tx.reportVersion.create({
                  data: {
                    reportId,
                    status: ReportVersionStatus.DRAFT,
                    submittedAt: null,
                  },
                })
              ).id;

        await this.tasksService.replaceMany(
          tx,
          targetVersionId,
          normalizedTasks,
        );
        await this.blockersService.replaceMany(
          tx,
          targetVersionId,
          dto.blockers ?? [],
        );
        await this.achievementsService.replaceMany(
          tx,
          targetVersionId,
          dto.achievements ?? [],
        );

        await tx.optionalNote.deleteMany({
          where: { reportVersionId: targetVersionId },
        });
        if (dto.notes) {
          await tx.optionalNote.create({
            data: { reportVersionId: targetVersionId, content: dto.notes },
          });
        }

        return tx.report.update({
          where: { id: reportId },
          data: {
            name: dto.name ?? undefined,
            startDate: dto.startDate ? new Date(dto.startDate) : undefined,
            endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            currentVersionId: targetVersionId, // now points to new
          },
          include: this.fullInclude(),
        });
      },
      { timeout: 15000 },
    );
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

    return this.prisma.$transaction(
      async (tx) => {
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
        await this.tasksService.replaceMany(
          tx,
          targetVersionId,
          normalizedTasks,
        );
        await this.blockersService.replaceMany(
          tx,
          targetVersionId,
          dto.blockers ?? [],
        );
        await this.achievementsService.replaceMany(
          tx,
          targetVersionId,
          dto.achievements ?? [],
        );

        await tx.optionalNote.deleteMany({
          where: { reportVersionId: targetVersionId },
        });
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
      },
      { timeout: 15000 },
    );
  }

  private defaultWeekRange(referenceDate?: string) {
    const now = referenceDate ? new Date(referenceDate) : new Date();

    if (isNaN(now.getTime())) {
      throw new BadRequestException('Invalid week parameter');
    }

    const day = now.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;

    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() + diffToMonday);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

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

  async findAll(user: RequestUser, query: FindReportsQueryDto) {
    const { projectId, submittedBy, status, page, limit } = query;
    const where: Prisma.ReportWhereInput = {};

    if (user.role === Role.TEAM_MEMBER) {
      where.createdBy = user.userId;
    } else if (user.role === Role.MANAGER) {
      where.project = { createdBy: user.userId };
      if (submittedBy) where.createdBy = submittedBy;
    } else {
      if (submittedBy) where.createdBy = submittedBy;
    }

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;

    const [reports, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        include: {
          currentVersion: true,
          project: { select: { id: true, name: true } },
          creator: { select: { id: true, username: true } },
        },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

  async findVersionHistory(user: RequestUser, query: FindReportsQueryDto) {
    const { projectId, submittedBy, status, page, limit } = query;

    const reportWhere: Prisma.ReportWhereInput = {};
    if (user.role === Role.TEAM_MEMBER) {
      reportWhere.createdBy = user.userId;
    } else if (user.role === Role.MANAGER) {
      reportWhere.project = { createdBy: user.userId };
      if (submittedBy) reportWhere.createdBy = submittedBy;
    } else if (submittedBy) {
      reportWhere.createdBy = submittedBy;
    }
    if (projectId) reportWhere.projectId = projectId;

    const versionWhere: Prisma.ReportVersionWhereInput = {
      report: reportWhere,
      ...(status ? { status } : {}),
    };

    const [versions, total] = await this.prisma.$transaction([
      this.prisma.reportVersion.findMany({
        where: versionWhere,
        include: {
          report: {
            select: {
              id: true,
              name: true,
              startDate: true,
              project: { select: { id: true, name: true } },
              creator: { select: { id: true, username: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reportVersion.count({ where: versionWhere }),
    ]);

    return {
      versions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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

    return this.prisma.$transaction(
      async (tx) => {
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
      },
      { timeout: 15000 },
    );
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

  async findLatestByMember(projectId: number) {
    const assignments = await this.prisma.assignedEmployee.findMany({
      where: { projectId },
      include: { user: { select: { id: true, username: true } } },
    });

    return Promise.all(
      assignments.map(async (a) => {
        const latestReport = await this.prisma.report.findFirst({
          where: { projectId, createdBy: a.userId },
          orderBy: { startDate: 'desc' },
          include: { currentVersion: true },
        });
        return { user: a.user, latestReport };
      }),
    );
  }

  // ---------------------------------------------------------------------
  // Dashboard: summary metrics
  // ---------------------------------------------------------------------

  async getDashboardSummary(week: string | undefined, user: RequestUser) {
    const { start, end } = this.defaultWeekRange(week);
    const projectScope = this.projectScopeFilter(user);

    const baseWhere = {
      ...projectScope,
      startDate: { gte: start, lte: end },
    };

    const [
      submitted,
      needsCorrection,
      approved,
      blockersCount,
      expectedSubmitters,
    ] = await Promise.all([
      this.prisma.report.count({
        where: { ...baseWhere, status: ReportVersionStatus.SUBMITTED },
      }),
      this.prisma.report.count({
        where: { ...baseWhere, status: ReportVersionStatus.NEEDS_CORRECTION },
      }),
      this.prisma.report.count({
        where: { ...baseWhere, status: ReportVersionStatus.APPROVED },
      }),
      this.prisma.blocker.count({
        where: {
          reportVersion: {
            report: {
              ...baseWhere,
              currentVersionId: { not: null },
            },
          },
        },
      }),
      this.getExpectedSubmitters(user),
    ]);

    const expectedIds = expectedSubmitters.map((m) => m.id);

    const distinctSubmitters = await this.prisma.report.groupBy({
      by: ['createdBy'],
      where: {
        ...baseWhere,
        createdBy: { in: expectedIds },
        status: {
          in: [
            ReportVersionStatus.SUBMITTED,
            ReportVersionStatus.NEEDS_CORRECTION,
            ReportVersionStatus.APPROVED,
          ],
        },
      },
    });
    const submittedCount = distinctSubmitters.length;
    const totalExpected = expectedSubmitters.length;

    return {
      totalSubmittedThisWeek: submitted + needsCorrection + approved,
      compliance: {
        submitted: submittedCount,
        pending: Math.max(totalExpected - submittedCount, 0),
      },
      needsCorrectionCount: needsCorrection,
      openBlockersCount: blockersCount,
    };
  }

  // ---------------------------------------------------------------------
  // Dashboard: charts
  // ---------------------------------------------------------------------

  async getDashboardInsights(weeks: number, user: RequestUser) {
    const since = this.weeksAgo(weeks);
    const projectScope = this.projectScopeFilter(user);

    const [
      tasksCompletedTrend,
      statusByMember,
      workloadByProject,
      timeByTaskType,
    ] = await Promise.all([
      this.getTasksCompletedTrend(projectScope, since),
      this.getStatusByMember(projectScope, since),
      this.getWorkloadByProject(projectScope, since),
      this.getTimeByTaskType(projectScope, since),
    ]);

    return {
      tasksCompletedTrend,
      statusByMember,
      workloadByProject,
      timeByTaskType,
    };
  }

  private async getTasksCompletedTrend(
    projectScope: Prisma.ReportWhereInput,
    since: Date,
  ) {
    const reports = await this.prisma.report.findMany({
      where: { ...projectScope, startDate: { gte: since } },
      select: {
        startDate: true,
        currentVersion: {
          select: {
            tasks: {
              where: { status: 'COMPLETED', isFutureTask: false },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    const byWeek = new Map<string, number>();
    for (const r of reports) {
      const key = new Date(r.startDate).toISOString().split('T')[0];
      const count = r.currentVersion?.tasks.length ?? 0;
      byWeek.set(key, (byWeek.get(key) ?? 0) + count);
    }

    return Array.from(byWeek.entries()).map(([week, completedCount]) => ({
      week,
      completedCount,
    }));
  }

  private async getStatusByMember(
    projectScope: Prisma.ReportWhereInput,
    since: Date,
  ) {
    const reports = await this.prisma.report.findMany({
      where: { ...projectScope, startDate: { gte: since } },
      select: {
        status: true,
        creator: { select: { id: true, username: true } },
      },
    });

    const byMember = new Map<
      number,
      {
        userId: number;
        username: string;
        draft: number;
        submitted: number;
        needsCorrection: number;
        approved: number;
      }
    >();

    for (const r of reports) {
      if (!r.creator) continue;

      const key = r.creator.id;
      if (!byMember.has(key)) {
        byMember.set(key, {
          userId: key,
          username: r.creator.username ?? 'Unknown',
          draft: 0,
          submitted: 0,
          needsCorrection: 0,
          approved: 0,
        });
      }
      const bucket = byMember.get(key)!;
      if (r.status === ReportVersionStatus.DRAFT) bucket.draft++;
      else if (r.status === ReportVersionStatus.SUBMITTED) bucket.submitted++;
      else if (r.status === ReportVersionStatus.NEEDS_CORRECTION)
        bucket.needsCorrection++;
      else if (r.status === ReportVersionStatus.APPROVED) bucket.approved++;
    }

    return Array.from(byMember.values());
  }

  private async getWorkloadByProject(
    projectScope: Prisma.ReportWhereInput,
    since: Date,
  ) {
    const reports = await this.prisma.report.findMany({
      where: { ...projectScope, startDate: { gte: since } },
      select: {
        project: { select: { id: true, name: true } },
        currentVersion: { select: { tasks: { select: { id: true } } } },
      },
    });

    const byProject = new Map<
      number,
      { projectId: number; projectName: string; taskCount: number }
    >();
    for (const r of reports) {
      if (!r.project) continue;

      const count = r.currentVersion?.tasks.length ?? 0;
      const existing = byProject.get(r.project.id);
      if (existing) {
        existing.taskCount += count;
      } else {
        byProject.set(r.project.id, {
          projectId: r.project.id,
          projectName: r.project.name,
          taskCount: count,
        });
      }
    }
    return Array.from(byProject.values());
  }

  private async getTimeByTaskType(
    projectScope: Prisma.ReportWhereInput,
    since: Date,
  ) {
    const grouped = await this.prisma.task.groupBy({
      by: ['type'],
      where: {
        isFutureTask: false,
        reportVersion: {
          currentOf: { isNot: null },
          report: { ...projectScope, startDate: { gte: since } },
        },
      },
      _sum: { timeSpent: true },
    });

    return grouped.map((g) => ({
      taskType: g.type,
      hours: g._sum.timeSpent ? Number(g._sum.timeSpent) : 0,
    }));
  }

  // ---------------------------------------------------------------------
  // Dashboard: activity feed
  // ---------------------------------------------------------------------

  async getRecentActivity(limit: number, user: RequestUser) {
    const projectScope = this.projectScopeFilter(user);

    const comments = await this.prisma.comment.findMany({
      where: { reportVersion: { report: projectScope } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        reviewer: { select: { username: true } },
        reportVersion: {
          select: {
            report: {
              select: { id: true, creator: { select: { username: true } } },
            },
          },
        },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      reportId: c.reportVersion.report.id,
      action:
        c.action === 'APPROVE'
          ? ('approved' as const)
          : ('needs_correction' as const),
      actorUsername: c.reviewer.username,
      targetUsername: c.reportVersion.report.creator.username,
      createdAt: c.createdAt.toISOString(),
    }));
  }

  // ---------------------------------------------------------------------
  // Shared scoping helpers
  // ---------------------------------------------------------------------

  private projectScopeFilter(user: RequestUser): Prisma.ReportWhereInput {
    if (user.role === Role.TEAM_MEMBER) return { createdBy: user.userId };
    if (user.role === Role.MANAGER)
      return { project: { createdBy: user.userId } };
    return {};
  }

  private async getExpectedSubmitters(user: RequestUser) {
    const projectWhere: Prisma.ProjectWhereInput =
      user.role === Role.MANAGER ? { createdBy: user.userId } : {};

    const assignments = await this.prisma.assignedEmployee.findMany({
      where: { project: projectWhere },
      select: { userId: true },
      distinct: ['userId'],
    });
    return assignments.map((a) => ({ id: a.userId }));
  }

  private weeksAgo(n: number): Date {
    const d = new Date();
    d.setDate(d.getDate() - n * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
