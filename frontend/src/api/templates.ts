import { client } from './client';
import type { FieldType } from '../types';

export interface TemplateFieldInput {
  name: string;
  fieldType: FieldType;
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  order: number;
}

export const templatesApi = {
  list: () => client.get('/api/templates').then((r) => r.data),

  getActive: () => client.get('/api/templates/active').then((r) => r.data),

  create: (data: { name: string; fields: TemplateFieldInput[] }) =>
    client.post('/api/templates', data).then((r) => r.data),

  update: (id: string, data: { name?: string; fields?: TemplateFieldInput[] }) =>
    client.put(`/api/templates/${id}`, data).then((r) => r.data),
};
