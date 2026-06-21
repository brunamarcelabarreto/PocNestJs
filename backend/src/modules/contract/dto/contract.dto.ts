import { IsString, IsObject, IsOptional, IsEnum, IsDate, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DEFAULT_CONTRACT_PAGE_LIMIT } from '../../../common/constants/pagination.constants';

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  CLOSED = 'CLOSED',
}

export class CreateContractDto {
  @IsString()
  templateId!: string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsObject()
  fields!: Record<string, any>;
}

export class UpdateContractDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  fields?: Record<string, any>;
}

export class ContractDto {
  id!: string;
  title!: string;
  description?: string;
  status!: ContractStatus;
  createdAt!: Date;
  updatedAt!: Date;
}

export class ContractListQueryDto {
  @IsOptional()
  @IsEnum(ContractStatus)
  status?: ContractStatus;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = DEFAULT_CONTRACT_PAGE_LIMIT;

  @IsOptional()
  @IsString()
  search?: string;
}
