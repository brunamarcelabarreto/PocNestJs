import { IsString, IsArray, IsBoolean, IsOptional, IsEnum } from 'class-validator';

export enum FieldType {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  TEXTAREA = 'TEXTAREA',
}

export class TemplateFieldDto {
  @IsString()
  name!: string;

  @IsEnum(FieldType)
  fieldType!: FieldType;

  @IsBoolean()
  required!: boolean;

  @IsOptional()
  @IsString()
  placeholder?: string;

  @IsOptional()
  @IsString()
  defaultValue?: string;

  order!: number;
}

export class CreateTemplateDto {
  @IsString()
  name!: string;

  @IsArray()
  fields!: TemplateFieldDto[];
}

export class UpdateTemplateDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  fields?: TemplateFieldDto[];
}

export class TemplateDto {
  id!: string;
  name!: string;
  version!: number;
  active!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  fields!: TemplateFieldDto[];
}
