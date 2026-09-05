import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
