import { client } from './client';

export interface ContractListParams {
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const contractsApi = {
  list: (params: ContractListParams = {}) =>
    client.get('/api/contracts', { params }).then((r) => r.data),

  getById: (id: string) =>
    client.get(`/api/contracts/${id}`).then((r) => r.data),

  create: (data: {
    templateId: string;
    title: string;
    description?: string;
    fields: Record<string, string>;
  }) => client.post('/api/contracts', data).then((r) => r.data),

  update: (
    id: string,
    data: { title?: string; description?: string; fields?: Record<string, string> },
  ) => client.put(`/api/contracts/${id}`, data).then((r) => r.data),

  activate: (id: string) =>
    client.patch(`/api/contracts/${id}/activate`).then((r) => r.data),

  close: (id: string) =>
    client.patch(`/api/contracts/${id}/close`).then((r) => r.data),

  getHistory: (contractId: string, page = 1, limit = 50) =>
    client
      .get(`/api/contracts/${contractId}/history`, { params: { page, limit } })
      .then((r) => r.data),
};
