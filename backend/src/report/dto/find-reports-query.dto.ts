import { IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ReportVersionStatus } from '../../generated/prisma/client';

export class FindReportsQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() projectId?: number;
  @IsOptional() @Type(() => Number) @IsInt() submittedBy?: number;
  @IsOptional() @IsEnum(ReportVersionStatus) status?: ReportVersionStatus;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page: number = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) limit: number = 10;
}
