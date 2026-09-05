import { IsString, IsBoolean } from 'class-validator';

export class BlockerDto {
  @IsString()
  name!: string;

  @IsBoolean()
  isKeyIssue!: boolean;
}
