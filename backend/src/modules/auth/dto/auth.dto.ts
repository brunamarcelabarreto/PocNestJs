import { IsEmail, IsString, MinLength } from 'class-validator';
import { MIN_NAME_LENGTH, MIN_PASSWORD_LENGTH } from '../../../common/constants/auth.constants';

export class RegisterTenantDto {
  @IsString()
  @MinLength(MIN_NAME_LENGTH)
  tenantName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  password!: string;

  @IsString()
  @MinLength(MIN_NAME_LENGTH)
  adminName!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class TokenResponseDto {
  accessToken!: string;
  refreshToken!: string;
  user!: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}
