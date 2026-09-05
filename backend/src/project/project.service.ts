import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignEmployeeDto } from './dto/assign-employee.dto';
import { Role } from '../generated/prisma/client';
import { RequestUser } from '../../types/user.types';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateProjectDto, user: RequestUser) {
    return this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive ?? true,
        createdBy: user.userId,
      },
    });
  }

  findAll(user: RequestUser) {
    if (user.role === Role.TEAM_MEMBER) {
      return this.prisma.project.findMany({
        where: { assignments: { some: { userId: user.userId } } },
        include: {
          assignments: {
            include: { user: { select: { id: true, username: true } } },
          },
        },
      });
    }
    return this.prisma.project.findMany({
      include: {
        assignments: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });
  }

  async findOne(id: number, user: RequestUser) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        assignments: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');

    if (user.role === Role.TEAM_MEMBER) {
      const isAssigned = project.assignments.some(
        (a) => a.userId === user.userId,
      );
      if (!isAssigned)
        throw new ForbiddenException('You are not assigned to this project');
    }
    return project;
  }

  async update(id: number, dto: UpdateProjectDto) {
    await this.ensureProjectExists(id);
    return this.prisma.project.update({
      where: { id },
      data: dto,
    });
  }

  async updateActiveStatus(id: number, state: boolean) {
    await this.ensureProjectExists(id);
    return this.prisma.project.update({
      where: { id },
      data: { isActive: state },
    });
  }

  async assignEmployee(projectId: number, dto: AssignEmployeeDto) {
    await this.ensureProjectExists(projectId);
    return this.prisma.assignedEmployee.create({
      data: { projectId, userId: dto.userId },
    });
  }

  async removeEmployee(projectId: number, userId: number) {
    await this.ensureProjectExists(projectId);
    return this.prisma.assignedEmployee.deleteMany({
      where: { projectId, userId },
    });
  }

  async deleteProject(projectId: number, userId: number) {
    const project = await this.ensureProjectExists(projectId);
    if (project.createdBy !== userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this project! only the creator of the project can delete it.',
      );
    }
    return this.prisma.project.delete({
      where: { id: projectId },
    });
  }

  private async ensureProjectExists(id: number) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }
}
