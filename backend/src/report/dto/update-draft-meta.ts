import { IsOptional, IsString, IsDateString } from 'class-validator';

export class UpdateDraftMetaDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
