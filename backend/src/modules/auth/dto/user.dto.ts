import { IsEmail, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { MIN_PASSWORD_LENGTH } from '../../../common/constants/auth.constants';

export enum UserRole {
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
}

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  password!: string;

  @IsString()
  name!: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole = UserRole.VIEWER;
}

export class UserDto {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}

export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  role!: UserRole;
  active!: boolean;
}
