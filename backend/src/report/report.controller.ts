/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { ReportService } from './report.service';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftMetaDto } from './dto/update-draft-meta';
import { ReviewReportDto } from './dto/review-report.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../generated/prisma/client';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { SubmitReportDto } from './dto/submit-report.dto';
import { SaveDraftDto } from './dto/save-draft.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('report')
export class ReportController {
  constructor(private reportsService: ReportService) {}

  @Post('draft')
  createDraft(@Body() dto: CreateDraftDto, @Req() req) {
    return this.reportsService.createDraft(dto, req.user);
  }

  @Post(':id/submit')
  submit(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitReportDto,
    @Req() req,
  ) {
    return this.reportsService.submit(id, dto, req.user);
  }

  @Get()
  findAll(@Query('projectId') projectId: string | undefined, @Req() req) {
    return this.reportsService.findAll(
      req.user,
      projectId ? Number(projectId) : undefined,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req) {
    return this.reportsService.findOne(id, req.user);
  }

  @Patch(':id/draft')
  saveDraft(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SaveDraftDto,
    @Req() req,
  ) {
    return this.reportsService.saveDraft(id, dto, req.user);
  }

  @Patch(':id')
  updateDraftMeta(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDraftMetaDto,
    @Req() req,
  ) {
    return this.reportsService.updateDraftMeta(id, dto, req.user);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Post(':id/review')
  review(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReviewReportDto,
    @Req() req,
  ) {
    return this.reportsService.review(id, dto, req.user);
  }

  @Roles(Role.MANAGER, Role.ADMIN)
  @Get('team/:projectId')
  findLatestByMember(@Param('projectId', ParseIntPipe) projectId: number) {
    return this.reportsService.findLatestByMember(projectId);
  }
}
