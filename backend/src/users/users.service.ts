import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role } from '../generated/prisma/client';
import { FindUsersQueryDto } from './dto/find-user-query.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: FindUsersQueryDto) {
    const { search, projectId, page, limit } = query;
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (projectId) {
      where.assignments = { some: { projectId } };
    }

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
        orderBy: { username: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { users, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  searchByEmail(email?: string) {
    if (!email) return [];
    return this.prisma.user.findMany({
      where: { email: { contains: email, mode: 'insensitive' } },
      select: { id: true, username: true, email: true, role: true },
      take: 10,
    });
  }

  async updateRole(id: number, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, email: true, role: true },
    });
  }
}
