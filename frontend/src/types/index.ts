export type UserRole = 'ADMIN' | 'VIEWER';
export type FieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'EMAIL' | 'PHONE' | 'TEXTAREA';
export type ContractStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED';
export type AuditAction =
  | 'CONTRACT_CREATED'
  | 'CONTRACT_UPDATED'
  | 'FIELD_UPDATED'
  | 'STATUS_CHANGED'
  | 'CONTRACT_ACTIVATED'
  | 'CONTRACT_CLOSED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
}

export interface TemplateField {
  id: string;
  name: string;
  fieldType: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  order: number;
}

export interface Template {
  id: string;
  name: string;
  version: number;
  active: boolean;
  fields: TemplateField[];
  createdAt: string;
}

export interface ContractField {
  id: string;
  fieldId: string;
  value: string | null;
  field: TemplateField;
}

export interface Contract {
  id: string;
  title: string;
  description?: string;
  status: ContractStatus;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  closedAt?: string;
  templateId: string;
  template?: { name: string };
  fields: ContractField[];
  createdByUser?: { id: string; name: string; email: string };
}

export interface AuditLog {
  id: string;
  action: AuditAction;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
