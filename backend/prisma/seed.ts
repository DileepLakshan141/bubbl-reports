import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  ReportVersionStatus,
  TaskType,
} from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Existing, real users (change according to your db users)
const ADMIN_ID = 1;
const TEAM_IDS = { patrick: 2, mark: 3, vihanga: 5, tharanga: 6 };
const MANAGER_ID = 4;

// current week start from 2026-09-06 2026-09-12 (end).
const CURRENT_WEEK_START = new Date('2026-09-06T00:00:00.000Z');

function weekStartFor(offsetWeeks: number): Date {
  const d = new Date(CURRENT_WEEK_START);
  d.setUTCDate(d.getUTCDate() - offsetWeeks * 7);
  return d;
}

function weekEndFor(start: Date): Date {
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + 6);
  return d;
}

const TASK_TEMPLATES: Record<TaskType, { name: string; output: string }[]> = {
  DEVELOPMENT: [
    { name: 'Implement report submission API', output: 'PR #142 merged' },
    { name: 'Build project dashboard UI', output: 'Deployed to staging' },
    { name: 'Fix version-history rendering bug', output: 'Patch shipped' },
    { name: 'Integrate charting library', output: 'Recharts wired up' },
  ],
  TESTING: [
    { name: 'Write RBAC integration tests', output: '12 tests added' },
    { name: 'QA pass on review workflow', output: 'Bug report filed' },
  ],
  MEETING: [
    { name: 'Sprint planning', output: 'Backlog groomed' },
    { name: 'Client sync call', output: 'Meeting notes shared' },
  ],
  DOCUMENTATION: [
    { name: 'Update API docs', output: 'README updated' },
    { name: 'Write onboarding guide', output: 'Confluence page published' },
  ],
};

const BLOCKER_TEMPLATES = [
  'Waiting on design sign-off for the dashboard layout',
  'Staging DB migration failing intermittently',
  'Blocked on third-party API credentials',
  'Unclear requirements on report correction UX',
];

const ACHIEVEMENT_TEMPLATES = [
  'Shipped the review/correction workflow end-to-end',
  'Reduced report load time by 40%',
  'Onboarded a new team member to the codebase',
  'Closed out all sprint blockers',
];

const CORRECTION_COMMENTS = [
  'Please add more detail on the blocker impact and recheck actual hours spent.',
  'The testing task shows 0% actual progress but is marked completed — please fix.',
  'Missing output/deliverable for the documentation task, add before resubmitting.',
];

const APPROVAL_COMMENTS = [
  'Looks good, approved.',
  'Thanks for the correction, approved.',
  'Solid week, no notes — approved.',
];

function pick<T>(arr: T[], seed: number): T {
  return arr[((seed % arr.length) + arr.length) % arr.length];
}

async function clearProjectAndReportData() {
  await prisma.comment.deleteMany();
  await prisma.optionalNote.deleteMany();
  await prisma.task.deleteMany();
  await prisma.blocker.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.report.updateMany({ data: { currentVersionId: null } });
  await prisma.reportVersion.deleteMany();
  await prisma.report.deleteMany();
  await prisma.assignedEmployee.deleteMany();
  await prisma.project.deleteMany();
}

type Scenario =
  | 'APPROVED_CLEAN'
  | 'APPROVED_AFTER_CORRECTION'
  | 'SUBMITTED'
  | 'NEEDS_CORRECTION'
  | 'DRAFT'
  | 'NONE';

async function createReport(
  projectId: number,
  userId: number,
  reviewerId: number,
  offsetWeeks: number,
  scenario: Scenario,
  seed: number,
) {
  if (scenario === 'NONE') return;

  const start = weekStartFor(offsetWeeks);
  const end = weekEndFor(start);

  const report = await prisma.report.create({
    data: {
      projectId,
      createdBy: userId,
      name: `Week of ${start.toISOString().slice(0, 10)}`,
      startDate: start,
      endDate: end,
      status: ReportVersionStatus.DRAFT,
    },
  });

  const buildVersionContent = async (
    versionId: number,
    isDraftOnly: boolean,
  ) => {
    await prisma.task.createMany({
      data: (
        ['DEVELOPMENT', 'TESTING', 'MEETING', 'DOCUMENTATION'] as TaskType[]
      ).map((type, i) => {
        const template = pick(TASK_TEMPLATES[type], seed + i);
        const done = !isDraftOnly && (seed + i) % 3 !== 0;
        return {
          reportVersionId: versionId,
          name: template.name,
          type,
          priority: pick(['LOW', 'MEDIUM', 'HIGH'], seed + i),
          status: done ? 'COMPLETED' : 'IN_PROGRESS',
          plannedProgress: 100,
          actualProgress: done ? 100 : 40 + ((seed + i) % 40),
          timePlanned: 8 + ((seed + i) % 6),
          timeSpent: done ? 8 + ((seed + i) % 6) : 3 + ((seed + i) % 4),
          output: done ? template.output : null,
          isFutureTask: false,
        };
      }),
    });

    const nextWeekTemplate = pick(TASK_TEMPLATES.DEVELOPMENT, seed + 9);
    await prisma.task.create({
      data: {
        reportVersionId: versionId,
        name: nextWeekTemplate.name,
        type: TaskType.DEVELOPMENT,
        priority: 'MEDIUM',
        status: 'NOT_STARTED',
        plannedProgress: 100,
        actualProgress: 0,
        timePlanned: 8,
        timeSpent: 0,
        output: null,
        isFutureTask: true,
      },
    });

    if (!isDraftOnly) {
      await prisma.blocker.createMany({
        data: [
          {
            reportVersionId: versionId,
            name: pick(BLOCKER_TEMPLATES, seed),
            isKeyIssue: true,
          },
          {
            reportVersionId: versionId,
            name: pick(BLOCKER_TEMPLATES, seed + 2),
            isKeyIssue: false,
          },
        ],
      });
      await prisma.achievement.create({
        data: {
          reportVersionId: versionId,
          name: pick(ACHIEVEMENT_TEMPLATES, seed),
          isKeyAchievement: true,
        },
      });
      await prisma.optionalNote.create({
        data: {
          reportVersionId: versionId,
          content: 'No additional context this week.',
        },
      });
    }
  };

  if (scenario === 'DRAFT') {
    const v = await prisma.reportVersion.create({
      data: {
        reportId: report.id,
        status: ReportVersionStatus.DRAFT,
        submittedAt: null,
      },
    });
    await buildVersionContent(v.id, true);
    await prisma.report.update({
      where: { id: report.id },
      data: { currentVersionId: v.id, status: ReportVersionStatus.DRAFT },
    });
    return;
  }

  if (scenario === 'SUBMITTED') {
    const v = await prisma.reportVersion.create({
      data: {
        reportId: report.id,
        status: ReportVersionStatus.SUBMITTED,
        submittedAt: start,
      },
    });
    await buildVersionContent(v.id, false);
    await prisma.report.update({
      where: { id: report.id },
      data: { currentVersionId: v.id, status: ReportVersionStatus.SUBMITTED },
    });
    return;
  }

  if (scenario === 'NEEDS_CORRECTION') {
    const v = await prisma.reportVersion.create({
      data: {
        reportId: report.id,
        status: ReportVersionStatus.NEEDS_CORRECTION,
        submittedAt: start,
      },
    });
    await buildVersionContent(v.id, false);
    await prisma.comment.create({
      data: {
        reportVersionId: v.id,
        reviewerId,
        action: 'REQUEST_CHANGES',
        comment: pick(CORRECTION_COMMENTS, seed),
      },
    });
    await prisma.report.update({
      where: { id: report.id },
      data: {
        currentVersionId: v.id,
        status: ReportVersionStatus.NEEDS_CORRECTION,
      },
    });
    return;
  }

  if (scenario === 'APPROVED_CLEAN') {
    const v = await prisma.reportVersion.create({
      data: {
        reportId: report.id,
        status: ReportVersionStatus.APPROVED,
        submittedAt: start,
      },
    });
    await buildVersionContent(v.id, false);
    await prisma.comment.create({
      data: {
        reportVersionId: v.id,
        reviewerId,
        action: 'APPROVE',
        comment: pick(APPROVAL_COMMENTS, seed),
      },
    });
    await prisma.report.update({
      where: { id: report.id },
      data: { currentVersionId: v.id, status: ReportVersionStatus.APPROVED },
    });
    return;
  }

  if (scenario === 'APPROVED_AFTER_CORRECTION') {
    // v1 — original submission, sent back
    const v1 = await prisma.reportVersion.create({
      data: {
        reportId: report.id,
        status: ReportVersionStatus.NEEDS_CORRECTION,
        submittedAt: start,
      },
    });
    await buildVersionContent(v1.id, false);
    await prisma.comment.create({
      data: {
        reportVersionId: v1.id,
        reviewerId,
        action: 'REQUEST_CHANGES',
        comment: pick(CORRECTION_COMMENTS, seed + 1),
      },
    });

    // v2 — corrected resubmission, approved. This pair is what your
    // "view past versions" feature should let a manager compare.
    const midWeek = new Date(start);
    midWeek.setUTCDate(midWeek.getUTCDate() + 3);
    const v2 = await prisma.reportVersion.create({
      data: {
        reportId: report.id,
        status: ReportVersionStatus.APPROVED,
        submittedAt: midWeek,
      },
    });
    await buildVersionContent(v2.id, false);
    await prisma.comment.create({
      data: {
        reportVersionId: v2.id,
        reviewerId,
        action: 'APPROVE',
        comment: pick(APPROVAL_COMMENTS, seed + 1),
      },
    });

    await prisma.report.update({
      where: { id: report.id },
      data: { currentVersionId: v2.id, status: ReportVersionStatus.APPROVED },
    });
  }
}

async function main() {
  await clearProjectAndReportData();

  const clientA = await prisma.project.create({
    data: {
      name: 'Client A Website',
      description: 'Marketing site rebuild for Client A',
      createdBy: MANAGER_ID,
    },
  });
  const internalTooling = await prisma.project.create({
    data: {
      name: 'Internal Tooling',
      description: 'Internal admin dashboards and scripts',
      createdBy: MANAGER_ID,
    },
  });
  const rndPlatform = await prisma.project.create({
    data: {
      name: 'R&D Platform',
      description: 'Experimental AI features platform',
      createdBy: ADMIN_ID,
    },
  });

  const assignments = [
    { projectId: clientA.id, userId: TEAM_IDS.patrick, reviewerId: MANAGER_ID },
    { projectId: clientA.id, userId: TEAM_IDS.mark, reviewerId: MANAGER_ID },
    {
      projectId: internalTooling.id,
      userId: TEAM_IDS.mark,
      reviewerId: MANAGER_ID,
    },
    {
      projectId: internalTooling.id,
      userId: TEAM_IDS.vihanga,
      reviewerId: MANAGER_ID,
    },
    {
      projectId: rndPlatform.id,
      userId: TEAM_IDS.vihanga,
      reviewerId: ADMIN_ID,
    },
    {
      projectId: rndPlatform.id,
      userId: TEAM_IDS.tharanga,
      reviewerId: ADMIN_ID,
    },
  ];

  await prisma.assignedEmployee.createMany({
    data: assignments.map((a) => ({
      projectId: a.projectId,
      userId: a.userId,
    })),
  });

  // offset 0 = current week (2026-09-06 → 09-12), offset 5 = 5 weeks back
  const scenarioByOffset: Scenario[] = [
    'SUBMITTED', // 0: current week — overridden per-assignment below
    'DRAFT', // 1 week back
    'NEEDS_CORRECTION', // 2 weeks back
    'SUBMITTED', // 3 weeks back
    'APPROVED_AFTER_CORRECTION', // 4 weeks back
    'APPROVED_CLEAN', // 5 weeks back
  ];

  let seed = 0;
  for (const assignment of assignments) {
    for (let offset = 0; offset < scenarioByOffset.length; offset++) {
      const scenario: Scenario =
        offset === 0
          ? seed % 2 === 0
            ? 'SUBMITTED'
            : 'NONE' // no report yet this week — drives "pending" metric
          : scenarioByOffset[offset];

      await createReport(
        assignment.projectId,
        assignment.userId,
        assignment.reviewerId,
        offset,
        scenario,
        seed,
      );
      seed++;
    }
  }

  console.log('Seed complete.');
  console.log(
    `Current week window: ${weekStartFor(0).toISOString().slice(0, 10)} → ${weekEndFor(weekStartFor(0)).toISOString().slice(0, 10)}`,
  );
  console.log('Projects: Client A Website, Internal Tooling, R&D Platform');
  console.log(
    'Log in as any of the 6 existing users to view role-specific dashboards.',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
