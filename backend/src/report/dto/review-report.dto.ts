import { IsEnum, IsString, MinLength } from 'class-validator';

export enum ReviewAction {
  APPROVE = 'APPROVE',
  NEEDS_CORRECTION = 'NEEDS_CORRECTION',
}

export class ReviewReportDto {
  @IsEnum(ReviewAction)
  action!: ReviewAction;

  @IsString()
  @MinLength(3)
  comment!: string;
}
