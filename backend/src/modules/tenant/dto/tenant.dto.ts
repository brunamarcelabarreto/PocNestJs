import { IsString, MinLength } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsString()
  @MinLength(3)
  slug!: string;
}

export class TenantDto {
  id!: string;
  name!: string;
  slug!: string;
}
