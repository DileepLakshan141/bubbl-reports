/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ProjectsService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { AssignEmployeeDto } from './dto/assign-employee.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('project')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  @Roles(Role.MANAGER, Role.ADMIN)
  @Post()
  create(@Body() dto: CreateProjectDto, @Req() req) {
    return this.projectsService.create(dto, req.user);
  }

  @Get()
  findAll(@Req() req) {
    return this.projectsService.findAll(req.user);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.projectsService.findOne(id, req.user);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Post(':id/assignments')
  assignEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignEmployeeDto,
  ) {
    return this.projectsService.assignEmployee(id, dto);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Delete(':id/assignments/:userId')
  removeEmployee(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.projectsService.removeEmployee(id, userId);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Delete(':id')
  deleteProject(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.projectsService.deleteProject(id, req.user.userId);
  }
}
