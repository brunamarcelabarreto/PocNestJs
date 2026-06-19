export enum AuditAction {
  CONTRACT_CREATED = 'CONTRACT_CREATED',
  CONTRACT_UPDATED = 'CONTRACT_UPDATED',
  FIELD_UPDATED = 'FIELD_UPDATED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  CONTRACT_ACTIVATED = 'CONTRACT_ACTIVATED',
  CONTRACT_CLOSED = 'CONTRACT_CLOSED',
}

export class AuditLogDto {
  id!: string;
  action!: AuditAction;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
  user!: {
    id: string;
    name: string;
    email: string;
  };
  createdAt!: Date;
}

export class CreateAuditLogDto {
  action!: AuditAction;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  description?: string;
}
