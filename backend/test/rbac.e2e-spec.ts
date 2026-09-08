import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, ReportVersionStatus } from '../src/generated/prisma/client';

describe('RBAC (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;

  // Test fixtures — created fresh before the suite, torn down after
  let managerA: { id: number; token: string };
  let managerB: { id: number; token: string };
  let memberA: { id: number; token: string };
  let memberB: { id: number; token: string };
  let projectA: { id: number };
  let projectB: { id: number };
  let reportA: { id: number }; // belongs to memberA, under projectA (managerA's project)

  const createdUserIds: number[] = [];
  const createdProjectIds: number[] = [];
  const createdReportIds: number[] = [];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    jwt = moduleFixture.get(JwtService);

    // --- Create users directly (no need to hash a real password we'll never check) ---
    const mkUser = async (username: string, role: Role) => {
      const user = await prisma.user.create({
        data: {
          username,
          email: `${username}-${Date.now()}@test.local`,
          role,
          passwordHash: 'not-used-in-this-test',
        },
      });
      createdUserIds.push(user.id);
      const token = jwt.sign({
        sub: user.id,
        role: user.role,
        email: user.email,
      });
      return { id: user.id, token };
    };

    managerA = await mkUser('rbac_manager_a', Role.MANAGER);
    managerB = await mkUser('rbac_manager_b', Role.MANAGER);
    memberA = await mkUser('rbac_member_a', Role.TEAM_MEMBER);
    memberB = await mkUser('rbac_member_b', Role.TEAM_MEMBER);

    // --- Two separate projects, each owned by a different manager ---
    const pA = await prisma.project.create({
      data: {
        name: 'RBAC Test Project A',
        description: 'x',
        createdBy: managerA.id,
      },
    });
    const pB = await prisma.project.create({
      data: {
        name: 'RBAC Test Project B',
        description: 'x',
        createdBy: managerB.id,
      },
    });
    createdProjectIds.push(pA.id, pB.id);
    projectA = { id: pA.id };
    projectB = { id: pB.id };

    await prisma.assignedEmployee.create({
      data: { projectId: pA.id, userId: memberA.id },
    });
    await prisma.assignedEmployee.create({
      data: { projectId: pB.id, userId: memberB.id },
    });

    // --- One SUBMITTED report, owned by memberA, under managerA's project ---
    const report = await prisma.report.create({
      data: {
        projectId: pA.id,
        createdBy: memberA.id,
        name: 'RBAC Test Report',
        startDate: new Date(),
        endDate: new Date(),
        status: ReportVersionStatus.SUBMITTED,
      },
    });
    const version = await prisma.reportVersion.create({
      data: {
        reportId: report.id,
        status: ReportVersionStatus.SUBMITTED,
        submittedAt: new Date(),
      },
    });
    await prisma.report.update({
      where: { id: report.id },
      data: { currentVersionId: version.id },
    });
    createdReportIds.push(report.id);
    reportA = { id: report.id };
  });

  afterAll(async () => {
    // Cascade-friendly teardown, most-dependent rows first
    if (reportA) {
      await prisma.comment.deleteMany({
        where: { reportVersion: { reportId: { in: createdReportIds } } },
      });
      await prisma.reportVersion.deleteMany({
        where: { reportId: { in: createdReportIds } },
      });
      await prisma.report.deleteMany({
        where: { id: { in: createdReportIds } },
      });
    }
    await prisma.assignedEmployee.deleteMany({
      where: { projectId: { in: createdProjectIds } },
    });
    await prisma.project.deleteMany({
      where: { id: { in: createdProjectIds } },
    });
    await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });

    await app.close();
  });

  // ---------------------------------------------------------------------
  // A team member must never be able to read another team member's report
  // ---------------------------------------------------------------------
  it("blocks a team member from reading another team member's report", async () => {
    await request(app.getHttpServer())
      .get(`/reports/${reportA.id}`)
      .set('Authorization', `Bearer ${memberB.token}`)
      .expect(403);
  });

  it("allows the report's own author to read it", async () => {
    await request(app.getHttpServer())
      .get(`/reports/${reportA.id}`)
      .set('Authorization', `Bearer ${memberA.token}`)
      .expect(200);
  });

  // ---------------------------------------------------------------------
  // A manager must only be able to review reports under projects they
  // created — not another manager's project, even though both are managers
  // ---------------------------------------------------------------------
  it('blocks a manager from reviewing a report outside their own projects', async () => {
    await request(app.getHttpServer())
      .post(`/reports/${reportA.id}/review`)
      .set('Authorization', `Bearer ${managerB.token}`)
      .send({ action: 'APPROVE', comment: 'trying to sneak an approval in' })
      .expect(403);
  });

  it('allows the owning manager to review the report', async () => {
    await request(app.getHttpServer())
      .post(`/reports/${reportA.id}/review`)
      .set('Authorization', `Bearer ${managerA.token}`)
      .send({ action: 'APPROVE', comment: 'looks good' })
      .expect(201); // or 200 depending on your controller's default status code — adjust if needed
  });

  // ---------------------------------------------------------------------
  // Role guard: a team member must never be able to hit a manager-only route
  // ---------------------------------------------------------------------
  it('blocks a team member from the review endpoint entirely, regardless of ownership', async () => {
    await request(app.getHttpServer())
      .post(`/reports/${reportA.id}/review`)
      .set('Authorization', `Bearer ${memberA.token}`)
      .send({ action: 'APPROVE', comment: 'not my job' })
      .expect(403);
  });

  // ---------------------------------------------------------------------
  // No token at all — every one of these routes must reject, not 500
  // ---------------------------------------------------------------------
  it('rejects unauthenticated requests with 401, not a 500', async () => {
    await request(app.getHttpServer())
      .get(`/reports/${reportA.id}`)
      .expect(401);
  });
});
