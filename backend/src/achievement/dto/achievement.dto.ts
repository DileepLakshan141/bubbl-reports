import { IsString, IsBoolean } from 'class-validator';

export class AchievementDto {
  @IsString()
  name!: string;

  @IsBoolean()
  isKeyAchievement!: boolean;
}
