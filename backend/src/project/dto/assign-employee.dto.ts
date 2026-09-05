import { IsInt } from 'class-validator';

export class AssignEmployeeDto {
  @IsInt()
  userId!: number;
}
