import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';

export class CreateDraftDto {
  @IsInt()
  projectId!: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;
}
