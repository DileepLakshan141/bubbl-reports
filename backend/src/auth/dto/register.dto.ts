import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { Role } from '../../generated/prisma/client';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(Role)
  role!: Role;
}
